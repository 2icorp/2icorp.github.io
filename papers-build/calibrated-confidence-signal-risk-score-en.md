# Calibrated Confidence as a Risk-Score Layer for Signal Decisions

## Summary

Most signal-decision systems threshold a classifier score into a hard yes/no. A prior
study found that open-set RF fingerprint hard-authentication does not work as a
standalone gate: unknown-rejection at a single observation was too low for field use,
and that finding implied the authentication output itself was the wrong shape. The
honest shape is not a pass/block gate at all, but a **risk score** that flows, together
with other signals (position, history, other sensors), into a fusion platform. For that
to be useful as fusion input, the probability the classifier reports has to match the
real-world hit rate: a decision the classifier calls "80% confident" has to actually be
right about 80% of the time. This is calibration. Systematic over-confidence in deep
neural networks is well documented in the literature, but whether the **classical DSP
feature + LightGBM** signal classifier we actually run has the same problem is a
separate, measurable question.

This paper measures it directly on the public DroneRF dataset (Al-Sa'd et al., Qatar
University, CC BY 4.0). A 24-dimensional physical feature set (RSSI, envelope
statistics, PAPR, carrier frequency offset, higher-order cumulants, spectral shape)
feeds a background-vs-drone binary detector. Across 5 seeds, each with a fresh
50/25/25 train/calibration/test split, we measured the Expected Calibration Error (ECE)
of the raw probability, then fit (a) Platt scaling, (b) 1-parameter temperature
scaling, and (c) isotonic regression on the calibration split, and re-measured ECE and
Brier score on the held-out test split. The result is unambiguous. Raw-probability ECE
averaged 0.0446 (std 0.0062), and all three calibration methods lowered it. The
largest improvement came from isotonic regression, ECE 0.0188 (std 0.0034), a roughly
58% reduction. Platt scaling and temperature scaling each cut it to about 0.0223 and
0.0228 respectively, roughly 49-50% reductions. The fitted temperature T averaged
1.599 (std 0.099), clearly above 1, which quantitatively confirms the classifier was
mis-calibrated in the over-confident direction. Ranking (AUROC) was preserved exactly
to five decimal places under Platt and temperature scaling (0.9374 -> 0.9374), and
dropped only marginally under isotonic regression (0.9374 -> 0.9363, about 0.001).
Standard calibration, in other words, does not change the underlying judgment; it
honestly fixes the confidence number attached to that judgment. The upshot: placing a
calibrated risk score where hard authentication was blocked is supported by measurement
on this signal classifier.

## 1. Background

A prior study tested open-set RF fingerprint hard-authentication as a real measurement,
and the verdict was NO-GO. Closed-set performance on registered signals was usable, but
the open-set rejection rate for unregistered, unknown signals at a single observation
(K=1, the condition closest to field deployment) was too low, meaning the false-accept
and false-reject cost of running the system as a standalone "match = pass, no match =
block" gate was not acceptable. The practical question that finding left behind was not
"should we throw this classifier's output away," but "how do we use this classifier's
output honestly."

The honest form is not standalone authentication but a **risk score**: a single number
that represents the probability a signal belongs to a given class, passed into a fusion
platform alongside position data, history, and other sensors' judgments. This design
sidesteps the low-open-set-rejection weakness head-on. Because no single decision rests
entirely on this one signal, the system does not collapse when this signal's confidence
is low. Instead, when another signal is stronger, the final decision leans that way,
and the risk score only dominates the final call when this signal is the only evidence
available.

For this design to hold, one precondition is non-negotiable: the number fed into fusion
has to be a **trustworthy probability**. If the classifier says "90% probability this
signal is a drone," that displayed 90% has to be close to the empirical frequency with
which such signals actually turn out to be drones. Otherwise the fusion algorithm
weights this signal by the wrong amount. If the classifier is systematically
over-confident (raw confidence consistently reads higher than the real hit rate), this
signal gets assigned more weight in fusion than it deserves, and the final decision gets
pulled toward this signal's verdict even in situations where another signal is actually
correct. Conversely, if the classifier under-confident, a genuinely strong signal does
not get reflected enough in fusion. A hard-authentication design can paper over this
problem by picking one good threshold; a risk-score fusion design cannot, because the
confidence number itself is the deliverable.

This is exactly why calibration matters. Systematic over-confidence in neural-network
classifiers, and the standard fixes for it (temperature scaling, Platt scaling,
isotonic regression), are well documented in the literature. Whether the pipeline we
actually run, a classical signal classifier built from hand-designed physical features
plus gradient-boosted trees (LightGBM), has the same problem, and whether standard
calibration methods have the same effect on it, is a separate question that has to be
measured. GBDT models learn differently from neural networks (leaf nodes output
empirical class frequencies directly), so it is not obvious a priori that the same
over-confidence pattern would appear in the same direction or the same magnitude. This
paper closes that question with measurement.

## 2. Method

### 2.1 Expected Calibration Error (ECE) and reliability diagrams

The standard definition of calibration is this: among all cases where the classifier
outputs probability p, the empirical accuracy of those cases should equal p if the
model is perfectly calibrated. To measure this, the predicted-probability range is
divided into equal-width bins, and within each bin the mean predicted confidence is
compared against the empirical accuracy. Expected Calibration Error (ECE) is the
weighted average, over bins, of the absolute gap between confidence and accuracy,
weighted by the number of cases in each bin.

```
ECE = sum_m (n_m / N) * |acc_m - conf_m|
```

where M is the number of bins, n_m is the case count in bin m, N is the total case
count, and acc_m and conf_m are the empirical accuracy and mean confidence of bin m.
This paper uses M=15 equal-width bins over [0, 1]. An ECE of 0 means perfect
calibration; larger values mean a larger gap between stated confidence and actual hit
rate. A reliability diagram plots this per-bin confidence and accuracy, and the
distance from the diagonal (y=x) visually shows the calibration error at each
confidence level.

Alongside ECE, we report the Brier score (mean squared error between predicted
probability and the true label). ECE is a binned, aggregate statistic and can be
sensitive to bin-edge choice, whereas Brier score is computed per-instance and
continuous, so the two are used to cross-check that they point the same direction.
Ranking performance is separately measured with AUROC (area under the ROC curve), to
confirm that calibration does not damage the substance of the judgment (the ability to
rank which signals are more likely dangerous).

### 2.2 Three calibration methods

The trained classifier's raw probabilities are remapped on a calibration split (a
separate slice of data used in neither training nor testing), using three methods.

**(a) Platt scaling.** The raw probability p is converted to a logit z =
log(p/(1-p)), and a 1-dimensional logistic regression sigmoid(A*z + B) is fit against
the calibration-split labels by maximum likelihood. It has two degrees of freedom, A
and B.

**(b) Temperature scaling.** The same logit z is divided by a scalar temperature T and
passed through a sigmoid: p_T = sigmoid(z/T). This is a 1-parameter method with no bias
term; T is found by scalar optimization minimizing negative log-likelihood (NLL) on the
calibration split. T > 1 means the raw logits were more extreme than warranted
(over-confident), and dividing by T squeezes the probability distribution away from the
extremes of 0 and 1, toward the middle.

**(c) Isotonic regression.** A non-parametric method that maps the raw probability p to
the true label with a monotonic (non-decreasing) function. Where Platt and temperature
scaling assume a specific functional form (sigmoid), isotonic regression assumes only
monotonicity and lets the data determine the rest. Its higher degree of freedom can fit
more precisely when the calibration split is large enough, but risks over-fitting when
the calibration split is small.

All three methods share a common property: they are **monotonic functions** of the raw
probability (or its logit). This has an important consequence: ranking is preserved.
As long as A and T are positive, Platt and temperature scaling are exact rank-preserving
transforms, and isotonic regression enforces monotonicity by construction (though ties,
where distinct raw scores collapse onto the same calibrated value, can create a very
small perturbation to AUROC). Section 4 confirms this with measurement.

## 3. Data and setup

Data is the public **DroneRF** dataset (Al-Sa'd et al., Qatar University, Mendeley
repository, DOI 10.17632/f4c2b4n755, license CC BY 4.0, commercially citable with
attribution). This is the same source dataset used by the earlier open-set
authentication study; this paper reuses that study's feature-extraction approach
(24-dimensional physical features) and applies it to the different question of
calibration.

Raw values are 10 million real-valued ADC amplitude samples per segment, split into
non-overlapping 4096-sample windows and deterministically strided-subsampled into
9,000 total windows. Background (noise only, is_drone=0) accounts for 1,800 windows,
and drone signal (Bebop, AR-drone, and Phantom across 9 flight-mode combinations,
is_drone=1) accounts for 7,200, a class imbalance that comes from the structure of the
dataset itself (not an artifact of our sampling). The task is defined as **binary
background-vs-drone detection**. ECE and Brier score have the simplest and most direct
definitions in the binary setting, which is why this task was chosen as the primary
target for measuring calibration.

24 features are extracted per window: RSSI (mean power, dB, 1 dim), envelope statistics
(mean, std, skewness, kurtosis, coefficient of variation, 5 dims) plus PAPR (1 dim),
instantaneous-frequency-based carrier frequency offset (CFO) statistics (mean, std,
kurtosis, 3 dims), higher-order cumulants (Swami and Sadler, 2000 method: C20, C21,
C40, C41, C42, C63, 6 dims), and Welch-PSD-based spectral shape features (centroid,
spread, flatness, entropy, and 4 band-energy ratios, 8 dims). The classifier is
LightGBM (300 trees, num_leaves=31, learning_rate=0.05), and features are standardized
using the training split's mean and standard deviation.

Across 5 random seeds (42, 7, 123, 2026, 99), each run generated a fresh
train/calibration/test split at 50%/25%/25%, stratified by label. For each seed, a new
LightGBM model was trained on the training split, all three calibration methods (Platt,
temperature, isotonic) were fit on the calibration split, and ECE, Brier score, and
AUROC were measured on the test split, which was used in neither training nor
calibration. Mean and standard deviation across the 5 seeds are reported as the final
result.

## 4. Results

### 4.1 ECE before and after calibration

Mean ECE across the 5 seeds:

| Method | ECE (mean) | ECE (std) | Improvement |
|---|---|---|---|
| Raw (uncalibrated) | 0.0446 | 0.0062 | - |
| Platt scaling | 0.0223 | 0.0022 | 50.0% |
| Temperature scaling | 0.0228 | 0.0025 | 48.9% |
| Isotonic regression | 0.0188 | 0.0034 | 57.9% |

```chart
{"kind":"bar","title":"Expected Calibration Error by method (5-seed mean)","labels":["Raw","Platt","Temperature","Isotonic"],"series":[{"name":"ECE","values":[0.0446,0.0223,0.0228,0.0188]}]}
```

All three calibration methods cut raw ECE by roughly half or more. Isotonic regression
showed the largest improvement (57.9% reduction), while Platt and temperature scaling
improved by almost identical amounts (50.0% and 48.9%). Platt and temperature scaling
landing at nearly the same magnitude means this dataset did not need much of a bias
term (B), which is consistent with the fitted temperature's mean (1.599) being clearly
above 1. T > 1 divides the raw logit, squeezing the probability distribution toward the
middle, and quantitatively means this classifier was mis-calibrated in the
over-confident direction. Across all 5 seeds, T ranged from 1.4376 to 1.7289, and no
seed produced a T below 1. In other words, this over-confidence bias is not noise that
fluctuates by seed; it is a consistent pattern.

### 4.2 Reliability diagram: where the over-confidence lives

Unpacking the single ECE number into a reliability diagram shows that over-confidence
is not spread evenly.

```chart
{"kind":"line","title":"Reliability diagram: empirical accuracy by predicted-confidence bin (seed=42)","labels":["0.03","0.10","0.23","0.30","0.37","0.43","0.50","0.57","0.63","0.70","0.83","0.90","0.97"],"series":[{"name":"Perfect calibration (diagonal)","values":[0.033,0.1,0.233,0.3,0.366,0.433,0.5,0.566,0.633,0.7,0.833,0.9,0.966]},{"name":"Before (raw)","values":[0.1515,0.1667,0.2982,0.3396,0.4615,0.4286,0.6341,0.6316,0.5,0.6579,0.6441,0.7882,0.9816]},{"name":"After (isotonic)","values":[0.1304,0.1585,0.2708,0.2754,0.4048,0.52,1.0,0.8571,0.628,0.7432,0.8986,0.9,0.9903]}]}
```

For the first seed (42), predictions in the 0.8-0.87 confidence bin (mean confidence
0.8335) had an empirical accuracy of only 0.6441. That is, cases where the classifier
said "about 83% confident" were actually right only 64% of the time. In contrast, the
0.93-and-above confidence bin (mean confidence 0.9946) had empirical accuracy 0.9816,
nearly on the diagonal. This means the over-confidence is not uniform across the
confidence range; it is concentrated in the mid-to-high confidence band around 0.8.
After isotonic calibration, the accuracy in that same band rose to 0.8986, much closer
to the diagonal. Note that the 0.50-confidence bin in this table has only a single test
sample for this seed after isotonic re-mapping, which is why its accuracy spikes to
1.0; this is small-sample noise in that bin, not a failure of the calibration method.

### 4.3 Is ranking preserved

| Method | AUROC (mean) | AUROC (std) |
|---|---|---|
| Raw (uncalibrated) | 0.93741 | 0.00502 |
| Platt scaling | 0.93741 | 0.00502 |
| Temperature scaling | 0.93741 | 0.00502 |
| Isotonic regression | 0.93633 | 0.00537 |

Platt and temperature scaling preserved the raw AUROC exactly to five decimal places.
This is the theoretical property from Section 2.2 (a monotonic transform via a positive
scalar or sigmoid does not change ranking) confirmed directly by measurement. Isotonic
regression dropped from a mean of 0.93741 to 0.93633, about 0.0011, which comes from
ties created when isotonic regression collapses distinct raw probabilities into the
same calibrated step; this is too small to represent a meaningful loss of judgment
quality. Brier score pointed in the same direction (raw 0.0832 -> Platt 0.0797 ->
temperature 0.0795 -> isotonic 0.0803). The improvement in Brier score (4-5%) is much
smaller than the improvement in ECE (49-58%), and that is expected: Brier score is also
driven by raw accuracy, so when the classifier's discriminative power is already high
(AUROC 0.937), there is not much absolute room left to improve. ECE, by contrast,
measures only the alignment between confidence and accuracy, so there is substantially
more room for calibration to improve it even under the same discriminative power.

## 5. Limitations and operational implications

**Operational implications.** The practical conclusion here is simple. When a signal
decision system hands its classifier output to a fusion platform as a risk score, it
should not pass the raw probability through as-is; it should pass it through a Platt or
isotonic mapping fit on a calibration split. This correction has essentially no cost to
judgment quality (AUROC is effectively preserved). The benefit is clear: not knowing
that decisions around 0.8 confidence are only right 64% of the time, and fusing that
signal at a weight of 0.83, is materially different from calibrating it and fusing it
at a weight closer to its real hit rate (around 0.65). In multi-sensor fusion
architectures in particular, if each sensor's confidence is distorted on a different
scale, the fusion rule itself (weighted averaging, Bayesian combination, and so on)
implicitly learns, or is designed with, the wrong weights. Calibration removes this
distortion before fusion, at relatively low cost.

Whether to choose Platt or isotonic is a tradeoff between the size of the calibration
split and the desired precision of the fit. Isotonic reduced ECE more in this
experiment, but that may be partly because the calibration split here was reasonably
generous (2,250 samples, the same size as the test split). In deployment environments
with much less calibration data (e.g., early after a new deployment, or where labels
are scarce), isotonic regression's higher degree of freedom carries more overfitting
risk, and Platt scaling's 2-parameter fit may be more stable. This paper did not
directly measure that tradeoff, and it remains an open question for follow-up work.

**Limitations.** This experiment measured calibration on a single task, binary
detection (background vs drone). The multi-class identification and open-set rejection
tasks covered by the earlier authentication study have their own calibration behavior
that has to be measured separately, and multi-class ECE is more complicated to define
and compute than the binary case (a choice remains between looking only at top-1
confidence or breaking it down per class). The dataset is also a single one (DroneRF),
and the background class is noise captured in a single environment (a lab at Qatar
University); the statistical properties of "background" can shift in a different
deployment environment, in which case the calibration mapping would need to be
re-fit for that environment. In other words, calibration is a procedure tied to a
specific dataset and deployment environment, not a fixed value that, once fit, can be
used forever. The standard deviation across the 5 seeds (roughly 0.002-0.006 in ECE) is
small, showing the result is not highly sensitive to the random seed, but that only
reflects variance from re-splitting the same dataset, not variance across different
deployment environments.

## 6. Reproduction

```bash
# 1) Feature extraction: the same 24-dimensional physical feature set described in
#    Section 2.1 (RSSI, envelope statistics, PAPR, CFO, higher-order cumulants,
#    spectral shape), self-contained in the experiment script
# 2) For each of 5 seeds, repeat train/calibration/test (50/25/25, label-stratified):
#    - fit LightGBM (300 trees, num_leaves=31) on the training split
#    - fit Platt (logistic regression), temperature (1-parameter NLL minimization),
#      and isotonic regression on the calibration split
#    - measure ECE (15 bins), Brier score, and AUROC on the test split
python3 calib_experiment.py
```

The full run completes in a few seconds on CPU alone (9,000 windows, 24-dimensional
features, 5 seeds times LightGBM with 300 trees times ECE computation for 4 probability
sets). No GPU or isolated virtual environment is required.

## References

1. M. Al-Sa'd, A. Al-Ali, A. Mohamed, T. Khattab, A. Erbad. "RF-based drone detection
   and identification using deep learning approaches." Future Generation Computer
   Systems, 2019. Dataset: DroneRF, Mendeley Data, DOI 10.17632/f4c2b4n755,
   CC BY 4.0, Qatar University.
2. C. Guo, G. Pleiss, Y. Sun, K. Q. Weinberger. "On Calibration of Modern Neural
   Networks." ICML, 2017. The canonical reference for temperature scaling and neural
   network over-confidence.
3. J. Platt. "Probabilistic Outputs for Support Vector Machines and Comparisons to
   Regularized Likelihood Methods." Advances in Large Margin Classifiers, 1999.
   Original paper for Platt scaling.
4. B. Zadrozny, C. Elkan. "Transforming Classifier Scores into Accurate Multiclass
   Probability Estimates." KDD, 2002. Canonical reference for isotonic-regression-based
   probability calibration.
5. A. Niculescu-Mizil, R. Caruana. "Predicting Good Probabilities with Supervised
   Learning." ICML, 2005. Comparison of calibration behavior across classifier
   families.
6. A. Swami, B. M. Sadler. "Hierarchical digital modulation classification using
   cumulants." IEEE Transactions on Communications, 2000. Basis for the higher-order
   cumulant features used in this experiment.
