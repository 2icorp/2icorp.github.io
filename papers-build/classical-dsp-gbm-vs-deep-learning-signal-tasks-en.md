# Classical DSP + GBM vs Deep Learning: A Measured Decision Map for Signal Tasks

## Abstract

A widespread assumption in the wireless signal processing community holds that
deep learning eventually beats classical digital signal processing (DSP) and
gradient-boosted machines (GBM) on every task. This paper narrows that
assumption into testable claims and measures them. Across six tasks -
modulation classification, fixed-false-alarm-rate interference detection,
drone open-set rejection, channel estimation, RF fingerprint fusion, and
co-channel signal separation - classical methods and deep learning were
compared head-to-head on the same data, the same splits, and the same
metrics. The results split by task rather than settling on a single
verdict. On the standard public benchmark RadioML2016.10a (6dB SNR subset),
classical methods (28-dimensional physical features plus LightGBM, accuracy
0.855) clearly beat deep learning (a 1.39M-parameter transformer, 0.681),
and this advantage did not reverse as training data grew from 539 to 9,900
samples (the gap narrows, but no crossover was observed within the measured
range). For fixed-false-alarm-rate interference detection, classical CFAR
(constant-false-alarm-rate) detectors held their target false-alarm rate
structurally even under a shifting noise floor, while an unconstrained
binary deep-learning detector saw its realized false-alarm rate explode to
1.0 under the same drift. On the public dataset DroneRF (CC BY 4.0), for
drone RF open-set rejection at a single observation (K=1), classical
feature-plus-Mahalanobis rejection achieved 5.7 times the unknown-device
rejection rate of a deep-learning baseline. Conversely, deep learning won
clearly on other tasks. For separating two overlapping co-channel signals,
a learned separator (a Conv-TasNet variant) achieved SI-SDRi of +3.01dB,
while classical independent component analysis (ICA) scored -14.25dB - worse
than the unseparated mixture itself. Deep learning also beat its own
classical fusion baseline on RF fingerprint fusion (AUROC 0.9994 vs 0.945 at
K=50 fusion), but that win carries several layers of caveats. Channel
estimation remains an open question: an early experiment with a methodology
flaw produced only an ambiguous signal, and no confirmed verdict exists yet.
This paper's goal is not to cheer for either side, but to publish, task by
task, what actually wins - together with the limits of those numbers.

## 1. Background

Deep learning has been treated as the default choice in wireless signal
processing for several years now. Whether the task is modulation
classification, interference detection, or RF fingerprint recognition, a
large share of published papers and vendor materials show deep learning
outperforming classical methods. Many of these comparisons, however, are
not fair. The deep-learning side is often given large training sets and GPU
tuning time, while the classical side is represented by untuned shallow
features or a simple threshold. The opposite error is also common: leaving
deep learning undertrained, or comparing only under low-data conditions that
favor classical methods. Neither direction gives an honest answer to the
question of who actually wins.

The question this paper asks is narrow and specific: **on the exact same
data, the exact same split, and the exact same metric, which of classical
DSP+GBM or deep learning actually wins on each specific wireless signal
processing sub-task?** That this cannot be answered with a single sentence
- "deep learning is better" or "classical is better" - is the first, and
most important, finding of this research. The winner differed task by
task, and so did the reason. Some tasks had training data too small for deep
learning to use its capacity; some were deterministic physical problems
where a learned representation was never necessary in the first place; and
some involved subtle hardware signatures that hand-designed features could
not easily capture, which is exactly where deep learning was needed.

The value of this paper lies less in any single verdict than in the
measurement discipline kept to reach it. Every number comes from an
experiment that was actually run; expected results of experiments that have
not yet executed are never cited as results. Numbers from synthetic data
and numbers from real public datasets are always labeled separately. Early
experiments with methodology flaws are recorded together with those flaws,
not quietly corrected away. This is the principle that runs through the
entire paper.

## 2. Evaluation Methodology

Six principles were kept across all six tasks.

**Same data, same split, same metric.** Classical methods and deep learning
share the same training/evaluation split, the same input window size, and
the same evaluation metric. No preprocessing or augmentation advantage was
given to either side.

**Fixed-false-alarm-rate discipline.** For detection-shaped tasks, a
"detection rate of X%" number is never used as the final result on its own,
because lowering the threshold lets anyone raise detection rate, at the
cost of false alarms. Thresholds are inverted from interference-free
training-split statistics to hit a target false-alarm rate, and that
threshold is applied unchanged to the test split - the standard CFAR
(constant-false-alarm-rate) discipline from radar signal processing.

**Oracle vs. naive baseline separation.** This is a real problem encountered
in the channel-estimation experiment: some cases where deep learning
appeared to "win" turned out to be against a weaker classical baseline
(naive least-squares, LS) rather than the stronger one (an oracle-grade MMSE
that knows the true channel statistics). Once this was recognized, every
subsequent comparison keeps a full classical performance ladder (from naive
to oracle-grade) and states explicitly which baseline the win is measured
against.

**Explicit synthetic vs. real-data labeling.** Measuring real wireless
signals requires real RF hardware and capture equipment, and not every task
in this paper has such a real capture available. Results from synthetic
data are not meaningless, but they are not cited with the same weight as
results from real data. Each section states its data provenance.

**Unfinished GPU runs are not cited as results.** Even when code and
experiment design are ready, if no completed result artifact exists, the
task is marked "unresolved" rather than described as a confirmed number.

## 3. Results by Task

### 3.1 Modulation Classification - Classical Wins

Classifying the modulation scheme of a radio signal (BPSK, QPSK, 16QAM,
etc.) from the signal itself. On the standard public benchmark
**RadioML2016.10a**'s 6dB SNR subset (11 modulation classes, 128-sample IQ
window, a fixed split of 539 training / 1,100 test examples), classical
methods (28-dimensional physical features - instantaneous amplitude/phase,
carrier frequency offset, Swami-Sadler higher-order cumulants, and more -
plus a tree-ensemble classifier) were compared against deep learning (a
1.39M-parameter mixture-of-experts transformer on raw IQ input, trained to
convergence over 600 epochs) on the identical train/test split.

| Method | Accuracy (11-way) |
|---|---|
| LDA (28 physical features) | 0.668 |
| RandomForest | 0.840 |
| XGBoost | 0.848 |
| **LightGBM** | **0.855** |
| CatBoost | 0.848 |
| Deep learning (transformer, 600 epochs, converged) | 0.681 |
| Chance level | 0.091 |

The same 28 features were also tested against recent modern tabular
learning models. TabPFN v2 came close at 0.848 but did not beat LightGBM,
and deep tabular models (TabM 0.781, RealMLP 0.778) and a stacking ensemble
(AutoGluon 0.818) also fell short of the gradient-boosted tree ensemble.
This suggests the answer is not "a better tabular model" - at this data
scale, gradient-boosted tree ensembles are already close to saturation.

**Does scaling up the data reverse this?** If deep learning's disadvantage
was simply a lack of data, the hypothesis was that scaling up training data
would reverse the verdict. This was tested separately, re-measuring on the
same 6dB data while only increasing training sample count.

| Training samples | Classical (LightGBM) | Deep learning (transformer) | Gap (DL - classical) |
|---|---|---|---|
| 539 | 0.728 | 0.368 | -0.360 |
| 2,000 | 0.794 | 0.581 | -0.213 |
| 5,000 | 0.814 | not measured | - |
| 9,900 | 0.844 | not measured | - |

```chart
{"kind":"line","title":"Accuracy vs training set size, RadioML2016.10a 6dB","labels":["539","2000"],"series":[{"name":"Classical (LightGBM)","values":[0.728,0.794]},{"name":"Deep learning (transformer)","values":[0.368,0.581]}]}
```

Classical led across every measured point, but deep learning closed the gap
quickly as data grew (gap -0.360 -> -0.213). The classical curve plateaued
gently around 0.84, and the deep-learning re-measurement at 5,000 and 9,900
samples was not completed in this run, so whether a crossover actually
exists was not observed within this data range (up to 9,900, a single SNR).
To be transparent, this table's classical accuracy at N=539 (0.728) differs
from the same N=539 point in the table above (0.855). The two experiments
use the same underlying data but different subsampling procedures, and
since the purpose of this scaling experiment is the relative slope of the
two curves rather than absolute accuracy, this discrepancy does not affect
the conclusion.

Separately, whether deep-learning pretraining (unsupervised, via masked
IQ-segment reconstruction) helps under label scarcity was also checked. At
1% labels (99 examples), random initialization scored 0.212 vs. 0.273
(+0.062) with pretraining; at 10% labels (990 examples), 0.504 vs. 0.554
(+0.050). The gain was consistent but modest. At full labels (9,900),
random initialization was slightly ahead (0.797 vs. 0.787). This low-label
local benefit is real, but it does not reverse the overall verdict of this
section.

### 3.2 Fixed-False-Alarm-Rate Interference Detection - Classical Has a Structural Advantage

Detecting wireless interference (jamming, unauthorized transmission, carrier
frequency offset, etc.) around a factory floor or medical device is a task
where the real contest is not the accuracy number but **whether the
false-alarm rate is actually held fixed**. This was measured on two
synthetic benches: an O-RAN/5G-style multi-slice scenario (concept-level,
not a standards-compliance test) and a second bench that deliberately
injects noise-floor drift to test whether the false-alarm-rate guarantee
survives a distribution shift.

On the first bench, a cell-averaging CFAR (CA-CFAR) detector combined with a
carrier-frequency-offset estimator achieved the following detection rates
at a target false-alarm rate of 5% (realized 5.29%):

| Impairment | Detection rate (Pd) | Slice localization accuracy |
|---|---|---|
| Barrage (full-band) jamming | 0.929 | 0.929 |
| Partial-band jamming (25%) | 0.986 | 0.991 |
| Single-tone jamming | 1.000 | 1.000 |
| Carrier frequency offset only | 1.000 | 1.000 |
| **Overall** | **0.980** | **0.982** (random baseline 0.167) |

No deep-learning counterpart exists for this bench, so this is a
classical-only number. Interestingly, barrage jamming - which injects the
most total power - had the lowest detection rate (0.929). This is the
well-known CFAR "masking" effect: a full-band jammer raises the
reference-cell noise estimate almost as much as the cell under test,
compressing the power-ratio statistic.

The second bench shows where the real contest lies. Several CFAR variants
(CA/OS/GO/SO-CFAR), an unconstrained binary deep-learning detector, and a
learned detector with CFAR discipline explicitly built into training (a
"constrained" deep learning variant) were re-evaluated at severity levels
held out from training, with an additional 12dB noise-floor drift injected
to see whether the target false-alarm rate actually held.

| Method | Realized false-alarm rate after drift, target 0.01 | Realized false-alarm rate after drift, target 0.001 |
|---|---|---|
| CA-CFAR | **0.0** | **0.0** |
| OS-CFAR | **0.0** | **0.0** |
| GO-CFAR | **0.0** | **0.0** |
| SO-CFAR | **0.0** | **0.0** |
| Cyclostationary detector | 0.100 | 0.007 |
| Unconstrained binary deep-learning detector | **1.000** | **1.000** |
| CFAR-constrained deep learning | 0.040 | 0.003 |

This table shows exactly where classical methods hold a real advantage on
this task. The CA/OS/GO/SO-CFAR family kept the target false-alarm rate
even under a 12dB noise-floor shift - meaning the property CFAR's name
promises (a constant false-alarm rate) held structurally, with no
recalibration. The unconstrained binary deep-learning detector, in
contrast, saw its 0.01-target threshold blow up to a realized false-alarm
rate of 1.0 under the same drift, meaning it flagged every window as
interference - a complete collapse of the false-alarm guarantee. The
deep-learning variant with CFAR discipline built into its loss landed in
between (0.04, 0.003). In other words, "fixed false-alarm rate" is not a
property that a single accuracy number can summarize - it must be measured
separately under distribution shift - and on this measurement, pure
classical CFAR provided the strongest guarantee.

### 3.3 Drone RF Open-Set Rejection - Classical Wins at Low K

Detecting and identifying drone control signals, and rejecting a new,
never-seen drone (an unknown device) at inference time. Using the public
dataset **DroneRF** (Al-Sa'd et al., Qatar University, Mendeley DOI
10.17632/f4c2b4n755, **CC BY 4.0**, citable commercially), a classical
pipeline (24-dimensional physical features: RSSI, envelope statistics,
carrier frequency offset, higher-order cumulants, spectral shape, plus
LightGBM and Mahalanobis-distance open-set rejection) was reimplemented and
compared, at matching fusion count K, against a same-genre deep-learning
experiment (ECAPA-TDNN embeddings with contrastive learning, on a different
dataset, CardRF).

| K (fused observations) | Classical unknown-rejection rate | Classical AUROC | DL unknown-rejection rate | DL AUROC |
|---|---|---|---|---|
| 1 | **0.424** | **0.648** | 0.074 | 0.565 |
| 5 | **0.581** | **0.720** | 0.129 | 0.708 |
| 10 | **0.725** | **0.811** | 0.408 | 0.761 |
| 20 | 0.875 | 0.937 | **0.917** | 0.829 |
| 50 | 1.000 | 1.000 | 1.000 | 0.914 |

```chart
{"kind":"bar","title":"Drone open-set rejection at K=1 (single observation)","labels":["Unknown-rejection rate","AUROC"],"series":[{"name":"Classical (DroneRF)","values":[0.424,0.648]},{"name":"Deep learning (CardRF, D1)","values":[0.074,0.565]}]}
```

At a single observation (K=1, no fusion), classical unknown-device
rejection was 5.7 times that of deep learning. The deep-learning embedding
essentially extracted no usable signal from a single packet (its
contrastive-learning objective had collapsed), while the 24-dimensional
hand-designed features were already meaningful at a single observation.
Classical led through K=5 and K=10 as well; at K=20 deep learning edged
ahead slightly (0.917 vs. 0.875), and at K=50 both effectively saturated
(1.0/1.0). The K=20 and K=50 points, however, involved only 40 and 16
unknown samples respectively, so this "tie" should be read as a sample-size
limit rather than evidence of method superiority.

**An honest comparison limit must be stated.** This is not a direct A/B on
the same dataset. The classical experiment used DroneRF (3 drone types, 2
known classes / 1 unknown), while the deep-learning experiment used CardRF
(6 controllers, 4 known / 2 unknown, including 4 units from the same
manufacturer). The task genre (drone RF open-set rejection, the same
Mahalanobis rejection recipe) matches, but the data and class structure
differ, so "classical beat deep learning" should be read as a same-genre
comparison, not a direct head-to-head on identical data. This classical
pipeline was also not strong at fine-grained manufacturer discrimination
(3-class accuracy 0.5685, majority-class baseline 0.444) - it is strong at
presence/absence detection and open-set rejection, but this 24-dimensional
feature set was insufficient for fine manufacturer discrimination.

### 3.4 Channel Estimation/Equalization - Not Yet Resolved

Estimating and reversing the effect of the wireless channel on a received
signal. This is the point where this paper must most honestly say "we do
not know yet." An early experiment conflated two distinct tasks - channel
estimation (NMSE metric) and full-receiver performance (BER metric) - into
a single verdict, and a later review found that some cases counted as deep
learning "wins" were in fact wins against a weaker naive least-squares (LS)
baseline rather than the stronger oracle-grade MMSE baseline. The
flawed-methodology aggregate result was 37 classical wins, 11 deep-learning
wins, and 51 ties out of 99 comparison cells, but this number is not cited
as a conclusion.

A corrected redesign - fully separating the estimation task from the
receiver task, adding a full classical performance ladder from naive LS to
oracle-grade, and adding an 8-axis out-of-distribution matrix - has been
prepared in code, but as of this paper's writing, the actual GPU run has
not been completed. Channel estimation is therefore left **unresolved**
between classical and deep learning. A directional guess is possible (that
classical/oracle-grade MMSE will likely remain strong, which was the
premise motivating the corrected redesign), but this paper's principle is
not to describe a guess as a confirmed result.

### 3.5 RF Fingerprint Fusion - Deep Learning Wins, With Several Layers of Caveats

Authenticating a device from the subtle analog imperfections its own
hardware imprints on a signal (an RF fingerprint). On the public research
dataset **WiSig** (CC BY-NC-SA, non-commercial research use only),
classical features (unsupervised, no GPU required, explainable) were
compared against a learned embedding (an ECAPA-TDNN-family model, requiring
GPU training) using multi-packet fusion (K fused packets per authentication
decision).

| K (fused packets) | Classical AUROC | DL AUROC |
|---|---|---|
| 1 | 0.549 | 0.696-0.739 |
| 10 | 0.766 | not measured |
| 20 | 0.863 | not measured |
| 50 | **0.945** | **0.9994** |
| 100 | 0.979 | not measured |

At K=50 fusion, deep learning beat classical's own baseline (0.9994 vs.
0.945). This win, however, carries at least three layers of caveats.

**First, this win is against our own K=50 classical baseline, not against
an external single-decision literature reference.** At the only point
directly comparable to published literature - a single packet, K=1, no
fusion - this deep-learning embedding scored AUROC 0.696-0.739, well below
a published reference value (a strict cross-receiver open-set AUROC of
0.9692).

**Second, this K=50 number raised a methodology concern in a post-hoc
audit.** The 50 observations used in fusion may not be 50 independent
authentication attempts, but correlated, consecutive packets from the same
capture session - a possibility the data structure does not rule out. If
so, 0.9994 would be the ceiling of a much easier task - a single-session
match boosted by accumulated signal-to-noise ratio - rather than 50
independent authentication decisions.

**Third, both methods are weak at the strict operating point that matters
for real access control.** On a real security metric - detection rate at a
0.1% false-accept rate, TAR@FAR=1e-3 - the own-protocol figures were 0.16%
at K=1 and only 43% at K=100. Under a stricter session-authentication
product-form condition (separating enrollment/verification by unseen
device and unseen day), the K=50 TAR@FAR=1e-3 was 22.35% - about a quarter
of the K=50 figure cited above (87.65%). Generalization to a commercially
unrestricted independent dataset (INRIA, CC BY) still showed decent
separability at K=1 (AUROC 0.868), but the same strict access-control
metric (TAR@FAR=1e-3) was only 2.9%.

Taken together, "deep learning beat classical at RF fingerprinting" is true
only at the benchmark level (K=50 measured the same way against K=50), not
against an external single-decision SOTA reference or a real security
operating point. Benchmark victory and product viability are different
questions, and this is the most heavily caveated of deep learning's wins.

### 3.6 Co-Channel Signal Separation - Deep Learning Wins Clearly

Separating two wireless signals whose frequencies nearly overlap in a
single received mixture. Because the license of a real multi-emitter
dataset (RFSS) for this task was unclear, and using it for training was
conservatively judged inappropriate, the same problem structure - two
linearly modulated signals overlapping at a small carrier-frequency offset,
swept across signal-to-interference ratio - was self-synthesized instead.
The learned separator adapts a speech-separation architecture, Conv-TasNet,
to complex IQ input (a 1D encoder, a dilated-TCN separator, masks, a
decoder, permutation-invariant training), and the classical baseline
treats a single receiver's two real I/Q channels as two observations for
FastICA (independent component analysis) plus a Hilbert transform.

The completed GPU result was unambiguous:

| Method | SI-SDRi (dB, higher is better) |
|---|---|
| Classical (FastICA + Hilbert transform) | **-14.25** |
| Deep learning (Conv-TasNet variant) | **+3.01** |

```chart
{"kind":"bar","title":"Co-channel RF signal separation: SI-SDRi (dB)","labels":["Classical (FastICA+Hilbert)","Deep learning (Conv-TasNet variant)"],"values":[-14.25,3.01]}
```

The classical method left the separated signal worse than the mixture
itself (negative SI-SDRi). Treating a single receiver's I/Q channels as two
independent observations does not structurally satisfy the requirements of
two-source independent component analysis - an expected weakness, not an
experimental error. The deep-learning separator showed a clear improvement
over the mixture (+3.01dB). Of the six tasks in this paper, this is the
cleanest, least-caveated win for deep learning. That said, this result too
comes from a self-synthesized mixture with the same structure, not from a
real public multi-emitter dataset.

## 4. The Combined Decision Map

Summarizing the six tasks on one page:

| Task | Data | Winner | Notes |
|---|---|---|---|
| Modulation classification | Real, public (RadioML2016.10a) | **Classical** | Holds up to 9,900 training samples |
| Fixed-FAR interference detection | Synthetic | **Classical** | Guarantee holds under drift |
| Drone open-set rejection (low K) | Real, public (DroneRF/CardRF, genre comparison) | **Classical** | DL edges ahead at K>=20 |
| Channel estimation/equalization | Mixed real+synthetic | **Unresolved** | Only a flawed early result exists |
| RF fingerprint fusion | Real, public (WiSig, non-commercial) | **Deep learning** (heavily caveated) | Reverses against external SOTA / real security metric |
| Co-channel signal separation | Synthetic (self-generated) | **Deep learning** | Least-caveated DL win |

```chart
{"kind":"bar","title":"Best performance per task: classical vs deep learning (0-1 scale metrics)","labels":["Modulation class. (accuracy)","Drone open-set K=1 (rejection rate)","RF fingerprint K=50 (AUROC)"],"series":[{"name":"Classical (DSP+GBM)","values":[0.855,0.424,0.945]},{"name":"Deep learning","values":[0.681,0.074,0.9994]}]}
```

What this map should convey is not a scoreboard of "classical 3, deep
learning 2, one unresolved." What decided each win or loss was the
**structure** of the task. Where training data was small (hundreds to
thousands of samples) and physically interpretable features existed
(modulation classification, interference detection, drone open-set
rejection), classical methods had the advantage. Where the task itself
required a learned representation rather than a deterministic physical
model - and data was plentiful (co-channel signal separation, the subtle
hardware signature behind RF fingerprinting) - deep learning had the
advantage. Channel estimation, where a fair experiment has not yet finished,
is honestly left unresolved. The claim that "deep learning is replacing
classical methods across signal processing" is not supported by the
measured evidence from these six tasks.

## 5. Limitations

Several limitations must be stated explicitly.

1. **Interference detection, interference localization, and the O-RAN/5G
   scenario are entirely synthetic data.** Real-world multipath, correlated
   shadowing, and real standards-compliant protocol integration are not
   reflected. These numbers should be read at the concept-feasibility
   level.
2. **Co-channel signal separation used a self-synthesized mixture with the
   same problem structure, not a real public multi-emitter dataset.** The
   real dataset's license was unclear, so it was conservatively excluded
   from training use.
3. **The core dataset behind RF fingerprint fusion (WiSig) is licensed for
   non-commercial research use only.** These numbers are valid as benchmark
   evidence but cannot be cited directly as commercial-product evidence.
4. **The drone open-set comparison is not a direct A/B on identical data,**
   but a comparison across two different datasets of the same genre
   (classical=DroneRF, deep learning=CardRF). A complete controlled
   comparison would require rerunning both methods on the same dataset.
5. **Channel estimation has no confirmed result beyond an early experiment
   with a known methodology flaw.** A corrected redesign exists in code but
   had not completed execution as of this paper's writing.
6. **The RF fingerprint K=50 fusion number was flagged in a post-hoc audit
   for possible cross-session correlation.** The possibility that the 50
   observations are correlated, consecutive packets rather than 50
   independent observations has not been fully ruled out.

## 6. Data and Reproducibility

The public datasets cited in this paper are:

- **RadioML2016.10a** - the standard modulation-classification benchmark
  (O'Shea & West). 6dB SNR subset, 11 classes.
- **DroneRF** - Al-Sa'd et al., Qatar University, Mendeley DOI
  10.17632/f4c2b4n755, **CC BY 4.0** (commercially citable with
  attribution).
- **WiSig** - a public multi-receiver dataset for RF fingerprint research,
  **CC BY-NC-SA** (non-commercial research use only).
- **INRIA dataset** - used for independent generalization checks in RF
  fingerprinting, **CC BY** (commercially citable).
- **CardRF** - a drone-controller RF dataset, research-use only (license
  unverified; a self-captured dataset is recommended for commercial
  citation).

Every experiment was designed to be reproducible under a fixed seed, and
every verdict was decided by a code-computed metric (accuracy, AUROC,
macro-F1, SI-SDR, realized false-alarm rate) rather than a self-report from
a human or a model. Experiments where a methodology flaw was later found
(the first channel-estimation pass, an early interference-detection smoke
test) are recorded together with the nature of that flaw, so the same
mistake is not repeated.

## References

1. O'Shea, T. J., West, N. (2016). Radio Machine Learning Dataset Generation
   with GNU Radio. *Proceedings of the GNU Radio Conference* (RadioML2016.10a
   dataset).
2. Swami, A., Sadler, B. M. (2000). Hierarchical digital modulation
   classification using cumulants. *IEEE Transactions on Communications*,
   48(3), 416-429.
3. Al-Sa'd, M. F. et al. (2019). RF-based drone detection and identification
   using deep learning approaches: An initiative towards a large open source
   drone database. *Future Generation Computer Systems*, 100, 86-97
   (DroneRF dataset, Mendeley DOI 10.17632/f4c2b4n755, CC BY 4.0).
4. Rohling, H. (1983). Radar CFAR thresholding in clutter and multiple
   target situations. *IEEE Transactions on Aerospace and Electronic
   Systems*, AES-19(4), 608-621.
5. Skolnik, M. I. *Introduction to Radar Systems*, 3rd ed., McGraw-Hill,
   chapter 6 (detection theory and CFAR).
6. Moose, P. H. (1994). A technique for orthogonal frequency division
   multiplexing frequency offset correction. *IEEE Transactions on
   Communications*, 42(10), 2908-2914.
7. Luo, Y., Mesgarani, N. (2019). Conv-TasNet: Surpassing ideal
   time-frequency magnitude masking for speech separation. *IEEE/ACM
   Transactions on Audio, Speech, and Language Processing*, 27(8),
   1256-1266.
8. Le Roux, J. et al. (2018). SDR-half-baked or well done? *Proceedings of
   ICASSP 2019* (SI-SDR metric).
9. arXiv:2607.02567 - a cross-receiver open-set RF fingerprint reference
   (CRODA-ST, strict cross-rx open-set AUROC 0.9692).
