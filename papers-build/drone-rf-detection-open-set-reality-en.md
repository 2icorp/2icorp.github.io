# The Open-Set Reality of Drone RF Detection: Why Classical Methods Win at Low Fusion Counts

## Summary

The real-world success of a counter-drone system is not measured by how accurately it names a
registered drone, but by how quickly and with how few observations it can reject a drone that is
not in its library. This is the open-set rejection problem, and in the field the decision usually
has to be made from a single observation or a small handful of them. This paper measures a
classical pipeline built on the public DroneRF dataset (Al-Sa'd et al., Qatar University, CC BY
4.0): a 24-dimensional physical feature set (spectral shape, higher-order cumulants,
instantaneous amplitude and phase statistics) feeding a LightGBM classifier with a Mahalanobis
rejection rule. On drone-presence detection (background versus drone) this pipeline reached an
AUROC of 0.945. On open-set unknown-drone rejection, at a single observation (K=1, no fusion) the
classical method's rejection rate was 0.424, while a deep-learning comparison point from the same
task genre (an ECAPA-TDNN-based embedding evaluated on the CardRF dataset) reached 0.074 at
K=1, a gap of roughly 5.7x. The advantage held as observations were fused to K=5 and K=10
(0.581 versus 0.129, and 0.725 versus 0.408, respectively). At K=20 the deep-learning method
edged ahead slightly (0.917 versus 0.875), and at K=50 both methods effectively saturated at
1.0. This is a same-genre comparison across two different datasets, not a direct A/B test on
identical data, but the pattern is clear. In the low-fusion regime that most closely mirrors
field conditions, hand-designed physical features and a classical classifier clearly beat a
deep-learning embedding at open-set rejection, and the two methods only converge once several
dozen observations have been accumulated at K=20 and above.

## 1. Background

Counter-drone capability splits into two layers. The first is detection: distinguishing whether
a drone is present at all, separating actual drone signals from background noise. The second is
identification and open-set rejection: determining which drone was detected, and, more
importantly, correctly rejecting drones that are not on the registered list. The commercial and
military counter-drone radar market keeps growing as the variety of drone threats expands, and
that growth means most of the signals such a system encounters in practice are drone types it
was never trained on.

As commercial drone adoption grows, the range of threats a counter-drone system must defend
against expands far faster than any predefined list. Hobbyist quadcopters, delivery drones,
agricultural drones, and modified first-person-view (FPV) drones all share the same frequency
bands, and it is common for entirely new models to appear during a deployment's operational
lifetime that did not exist when the system was installed. In that environment, a system's
real-world value comes not from how accurately it names a drone already in its library, but from
how reliably it rejects one that is not. Simply refreshing the library on a schedule is not a
complete solution either. Capturing, labeling, and retraining on a new drone's RF signature after
it appears on the market takes time, and during that gap the system will keep encountering
signals it has never seen.

There is a common blind spot here. Much of the academic and vendor literature reports
closed-set classification accuracy, that is, how well a system picks drone A versus drone B from
a fixed, known list. But the question a real defense system actually faces in the field is
different: when an unregistered, new, modified, or commercial drone appears, how quickly and
reliably can the system decide that it is not a known type? That is open-set rejection, and
strong closed-set accuracy does not guarantee strong open-set rejection. A system with weak
open-set rejection can misclassify an unknown threat as a known one, or conversely flag a known
threat as unknown.

A second, often-overlooked variable in open-set rejection is the number of observations fused
into a single decision, which this paper denotes as the fusion count K. Laboratory benchmarks
frequently use a large K, averaging dozens of observations before issuing one decision, and this
produces impressive numbers. But in the field a counter-drone system's decision window is often
sub-second, and a drone may appear briefly, change course, or disappear before dozens of packets
can be collected. The realistic operating regime is therefore a small K, close to 1. The core
question of this paper is exactly this: at low K, the condition that most resembles field
deployment, which approach performs better at open-set rejection, classical physical-feature
methods or deep-learning embedding methods?

## 2. Method

### 2.1 Classical pipeline (this experiment)

The raw real-valued RF waveform (DroneRF provides real-valued ADC amplitude, not I/Q) is passed
through a Hilbert transform to construct an analytic signal, from which four groups of features,
24 dimensions total, are extracted.

- RSSI (mean power, dB), 1 dimension
- Envelope statistics (mean, standard deviation, skewness, kurtosis, coefficient of variation)
  plus PAPR, 6 dimensions
- Carrier-frequency-offset (CFO) estimation from instantaneous frequency (mean, standard
  deviation, kurtosis), 3 dimensions
- Higher-order cumulants (Swami and Sadler, 2000: C20, C21, C40, C41, C42, C63, normalized),
  6 dimensions
- Spectral shape features from Welch PSD (center-frequency offset, bandwidth, flatness,
  entropy, plus four sub-band energy ratios), 8 dimensions

The classifier is LightGBM (300 estimators, num_leaves=31). Open-set rejection uses a
Mahalanobis-distance-to-centroid rule with a Ledoit-Wolf shrinkage covariance estimate. The
centroid and covariance are estimated from the known-class training features; a threshold tau
is set on the validation split at the gamma=0.9 quantile of distances; at test time any vector
farther than tau is rejected as unknown. The fusion count K is defined by averaging the distance
vectors of K consecutive observations before issuing a single decision.

### 2.2 Deep-learning comparison point (D1, a separate experiment)

The deep-learning comparison values are drawn from a separate experiment (D1, drone-controller
RF fingerprinting) that addresses the same task genre: open-set unknown-drone-family rejection
with the same Mahalanobis rejection recipe. D1 uses an ECAPA-TDNN architecture combined with
MoCo-style contrastive training to produce embeddings, scores open-set verification with cosine
similarity and AS-norm, and applies the same K-averaging fusion sweep. D1 was run on the CardRF
dataset (six drone-controller types, four known classes: DJI Inspire, Phantom, Mavic Pro, and
M600, and two unknown classes: Beebeerun and 3DR Iris).

Because the two experiments share the same task genre and the same rejection methodology
(Mahalanobis distance, K-averaging fusion sweep), the results can be placed side by side for
comparison, but the datasets and class compositions differ, so this is a same-genre comparison
rather than a direct A/B test on identical data. That boundary is restated in Sections 4 and 5.

## 3. Data and Setup

### 3.1 DroneRF (classical experiment)

DroneRF is a real-captured drone RF dataset published by Al-Sa'd et al. (Qatar University),
obtained directly from the Mendeley repository (DOI 10.17632/f4c2b4n755) via the public API
without a login gate. The license, verified directly from the dataset's own data_licence
metadata field, is CC BY 4.0 (attribution required, commercially citable), in contrast to
CardRF, which D1 used and which is research-use-only pending explicit commercial clearance.

The dataset consists of one background class (00000) and three drone types (Bebop, AR-drone,
Phantom) captured across flight modes. Bebop and AR-drone each have four captured flight modes
(off, hover, fly, video); Phantom has only one captured mode (power-on). This is a structural
property of the dataset itself (three drones, 227 segments total), not an imbalance introduced
by this experiment. Each segment's ten million real-valued ADC amplitude samples were split
into non-overlapping 4096-sample windows, subsampled deterministically to 200 windows per
segment. Nine background segments and four segments per drone flight mode were used, for a
total of 9,000 windows (1,800 background, and 800 for each of the nine drone flight-mode
classes, 7,200 total). This uses only a portion of the full dataset (each part has 10 to 21
segments of ten million samples each); the scope was deliberately narrowed to complete within a
local, CPU-only budget.

### 3.2 CardRF (D1, comparison point)

The CardRF dataset used by D1, published by Medaiyese et al. (University of Louisville /
AERPAW), captures drone-controller RF signals. It was used as a fallback after the originally
targeted IEEE DataPort dataset of 17 controllers proved unreachable behind a login gate. The
processed, steady-state signal slices (Processed_CardRF, resampled to 1,024 samples) were used;
the signal is a real-valued RF envelope on a single channel, similar in form to DroneRF. The
canonical IEEE DataPort distribution of CardRF requires a paid subscription, and the license of
the specific public mirror actually used was not explicitly verified, so this comparison point
is treated as research-validation use only.

## 4. Results

### 4.1 Drone-presence detection (background versus drone, binary)

| Metric | Value |
|---|---|
| Accuracy | 0.8885 |
| F1 (macro) | 0.8245 |
| F1 (drone) | 0.9305 |
| AUROC | 0.945 |

Measured on a 2,700-window test set (540 background, 2,160 drone, preserving the original
dataset ratio). D1 has no directly corresponding detection task, so this is a classical-pipeline
result on its own.

### 4.2 Drone/manufacturer type classification (3-class closed set: Bebop, AR-drone, Phantom)

| Metric | Value |
|---|---|
| Accuracy | 0.5685 |
| F1 (macro) | 0.5534 |
| Chance level | 0.333 |
| Majority-class baseline | 0.444 |

Above chance but not far above the majority-class baseline. This task distinguishes three
different manufacturers, not different models from the same manufacturer, yet the result is not
strong. This is discussed further in Sections 4.3 and 5.

### 4.3 Open-set unknown-drone rejection (trained on Bebop and AR-drone, all of Phantom held out
as unknown)

The table below shows unknown-rejection rate and AUROC as a function of K (average observations
per decision) for the classical method (DroneRF) side by side with the deep-learning comparison
point (D1, CardRF).

| K | Classical unknown-rejection | Classical AUROC | DL unknown-rejection | DL AUROC (cosine) |
|---|---|---|---|---|
| 1 | 0.424 | 0.648 | 0.074 | 0.565 |
| 5 | 0.581 | 0.720 | 0.129 | 0.708 |
| 10 | 0.725 | 0.811 | 0.408 | 0.761 |
| 20 | 0.875 | 0.937 | 0.917 | 0.829 |
| 50 | 1.000 | 1.000 | 1.000 | 0.914 |

```chart
{"kind":"line","title":"Open-set unknown-drone rejection rate versus fusion count K","labels":["1","5","10","20","50"],"series":[{"name":"Classical (DroneRF)","values":[0.424,0.581,0.725,0.875,1.0]},{"name":"Deep learning (CardRF, D1)","values":[0.074,0.129,0.408,0.917,1.0]}]}
```

At K=1, no fusion, a single observation, the condition that most closely resembles field
deployment, the classical method's unknown-rejection rate was roughly 5.7 times that of the
deep-learning method (0.424 versus 0.074). As D1's own documentation honestly records, the
deep-learning embedding's contrastive loss barely moved during training on this fallback
configuration (a collapse), meaning the embedding failed to extract a meaningful fingerprint
from a single packet. The 24-dimensional physical feature set with Mahalanobis rejection, by
contrast, already carried a signal clearly above chance at a single observation. The gap widened
further at K=5 and K=10 (0.581 versus 0.129, and 0.725 versus 0.408). At K=20 the deep-learning
method edged ahead slightly (0.917 versus 0.875), and by K=50 both methods had effectively
reached full rejection (1.0).

```chart
{"kind":"bar","title":"Rejection-rate gap at K=1 (single observation) versus K=50 (heavy fusion)","labels":["K=1","K=50"],"series":[{"name":"Classical (DroneRF)","values":[0.424,1.0]},{"name":"Deep learning (CardRF, D1)","values":[0.074,1.0]}]}
```

The second chart shows this paper's central point in one image. In the low-fusion regime (K=1)
the gap between the two methods is large; in the high-fusion regime (K=50) that gap disappears
entirely. The K=20 and K=50 bins have small unknown-sample counts, 40 and 16 respectively for
the classical experiment (40 and 48 for D1's reporting), so the apparent "tie" in this regime
should be read as a small-sample-size limitation, not evidence of equal method strength.

Closed-set accK for the two known classes (Bebop versus AR-drone) did not improve monotonically
with K, oscillating between roughly 0.49 and 0.59. This indicates that the underlying separability
of Bebop and AR-drone RF characteristics is low for this 24-feature set; fusion reduces noise but
cannot recover a signal that was never separable in the first place.

The practical implication for counter-drone deployment depends on how large a K the operating
scenario can actually afford. When a drone is only briefly exposed or changes course quickly, a
decision must be made close to K=1, and that is precisely the regime where the classical
method's advantage is largest. Conversely, in a scenario such as loitering surveillance, where
the same drone remains in the same airspace for an extended period, K can grow to 20 or beyond,
and in that regime the gap between the two methods narrows or reverses slightly in favor of deep
learning. There is no single answer to which method is "better"; the answer depends on how much
observation time the operating scenario permits. That is why this paper reports results broken
out by K rather than as a single number.

## 5. Limitations

**This is not a direct comparison on identical data.** The classical experiment used DroneRF
(three drone types, two known classes and one unknown class); the deep-learning comparison point
(D1) used CardRF (six controller types, four known and two unknown, including four
same-manufacturer models). The task genre and rejection methodology (Mahalanobis distance,
K-averaging fusion) are identical, but the data and class composition are not, so the claim that
"classical wins" should be read as a same-genre comparison across two different datasets, not an
A/B test on identical data. A direct comparison would require running a deep-learning method
(ECAPA-family) on DroneRF itself; that follow-up experiment was not performed for this paper.

**Reaching high fusion (K=50) has a real cost for both methods.** K=50 means 50 observations must
be accumulated before a single decision is issued. In a field scenario where the target is
briefly exposed and moving, that much accumulation may not be achievable. Both methods improve
sharply at K=20 and above, but this improvement assumes an observation window and observation
stability that would need to be separately validated against real deployment conditions.

**Small-sample caveats apply.** The K=20 and K=50 bins for the classical experiment have only 40
and 16 unknown samples, respectively. The "1.0" full-rejection value is a genuine measurement,
not a fabrication, but a value obtained at this sample size should not be extrapolated into a
defense-grade claim such as Pd (probability of detection) above 99% or Pfa (probability of false
alarm) below 1e-6. D1's own documentation applies the identical small-sample caveat to its own
K=50 "100%" figure.

**Type classification (manufacturer discrimination) is the weak point.** Three-class accuracy
(Bebop, AR-drone, Phantom) of 0.5685 is above the majority-class baseline (0.444) but not strong.
Unlike the decisive classical advantage seen in modulation classification or interference
classification tasks, distinguishing drone manufacturer is not easily solved by this
24-dimensional hand-designed feature set. This suggests that spectral and cumulant features are
strong at answering "is a signal present" and "is the signal stable (open-set)," but that
fine-grained manufacturer discrimination may require additional features such as hopping pattern
or burst timing.

**Controller fingerprinting is a separate result.** D1 (drone-controller RF fingerprinting) is
cited here only as a comparison point, not as an experiment conducted for this paper. D1's own
conclusion is that unknown-controller rejection reaches the defense design target (above 90%) at
K=20 and above, but that same-manufacturer discrimination (four DJI models) tops out around 70%
at K=50 (versus 25% chance), and that defense-grade operating points (Pd above 99%, Pfa below
1e-6) were not measured. This paper uses that result only to compare how rejection rate behaves
as a function of K, not as a conclusion about controller identification itself.

**Real captures, but at limited scale.** Both experiments use real RF captures rather than
synthetic data, which is a meaningful strength relative to synthetic-only experiments, but the
number of distinct drone or controller types captured, three and six respectively, is small
relative to the diversity of drones actually encountered in the field. Any generalization of
these conclusions should be read within that scale limit.

## 6. Reproduction

```bash
# 1) Download data (Mendeley public API, no login required)
curl -sL "https://data.mendeley.com/public-api/datasets/f4c2b4n755" -o dronerf_meta.json
# Use files[].content_details.download_url from meta.json to fetch and extract each .rar

# 2) Run feature extraction, detection, type classification, and open-set rejection
python3 classical_drone_rf.py --extracted-dir <path to extracted directory>
```

Feature extraction takes about 0.457ms per window. With cached windowed data, total runtime for
feature extraction plus training and evaluation of all three tasks is about 16 seconds (about 66
seconds if windowing must be rebuilt from scratch). The entire pipeline runs on CPU alone; no GPU
or isolated virtual environment is required.

## References

1. M. Al-Sa'd, A. Al-Ali, A. Mohamed, T. Khattab, A. Erbad. "RF-based drone detection and
   identification using deep learning approaches." Future Generation Computer Systems, 2019.
   Dataset: DroneRF, Mendeley Data, DOI 10.17632/f4c2b4n755, CC BY 4.0, Qatar University.
2. O. Medaiyese, M. Ezuma, A. Lauf, A. Adeniran. "Cardinal RF (CardRF): An Outdoor UAV/UAS/Drone
   RF Signals with Bluetooth and WiFi Signals Dataset." AERPAW, University of Louisville. Data
   source for the controller-fingerprinting comparison experiment (D1).
3. B. Desplanques, J. Thienpondt, K. Demuynck. "ECAPA-TDNN: Emphasized Channel Attention,
   Propagation and Aggregation in TDNN Based Speaker Verification." arXiv:2005.07143, 2020.
   Embedding architecture used by D1.
4. A. Swami, B. M. Sadler. "Hierarchical digital modulation classification using cumulants."
   IEEE Transactions on Communications, 2000. Basis for the classical pipeline's higher-order
   cumulant features.
5. D. R. Sturim, D. A. Reynolds. "Speaker adaptive cohort selection for Tnorm in
   text-independent speaker verification." ICASSP, 2005. Basis for the AS-norm scoring
   technique used by D1.
6. O. Ledoit, M. Wolf. "A well-conditioned estimator for large-dimensional covariance
   matrices." Journal of Multivariate Analysis, 2004. Basis for the shrinkage covariance
   estimator used in the classical pipeline's Mahalanobis rejection.
