# WiFi-CSI Cross-Environment Calibration

*Author: 2i*

## Abstract

WiFi channel state information (CSI) sensing is attractive because a single
router can detect presence, falls, or motion without any dedicated sensor.
The question that actually matters in deployment, though, is not "what
accuracy does it reach" but "how much of that accuracy survives once the
device leaves the room it was trained in." CSI amplitude is strongly shaped
by the receiver's automatic gain control, antenna placement, and the
multipath reflections created by walls and furniture, so a classifier
trained in one physical condition is widely believed to degrade sharply in
another. This paper measures that belief directly, reports why the
measurement turned out to be harder than expected, and quantifies how much
of the resulting loss a small amount of target-domain calibration data can
recover.

The experiment runs on the public UT-HAR dataset (SenseFi redistribution,
7 activities, 250-step by 90-channel CSI amplitude windows) through a
classical feature-extraction (158 handcrafted dimensions) and LightGBM
7-way activity classification pipeline. The first domain-shift axis we
tried was the only grouping variable this redistribution actually
publishes: the official train/val/test boundary. It showed essentially no
domain shift at all (zero-shot accuracy 94.7-94.9%, matching the in-split
baseline of 95.2% within noise), which is exactly what the SenseFi paper's
own caveat about sliding-window overlap causing leakage across that
boundary predicts. Because the published metadata cannot support a
verified cross-room, cross-subject, or cross-day split, we constructed our
own domain-shift proxy with unsupervised clustering on each window's
per-channel mean amplitude, a physical fingerprint of receiver gain and
multipath. On this constructed split ("pseudo-session"), the story flips
completely. A classifier trained on the source domain (3624 windows) and
applied zero-shot to the target domain (1349 windows) collapses to 55.08%
accuracy. Training on target-domain data alone caps out at 92.37%, so the
domain-shift gap is 37.29 percentage points. Adding 1, 5, 10, 20, or 50
labeled target examples per class to the source training set recovers
57.16%, 64.55%, 70.62%, 78.23%, and 84.92% accuracy respectively, which is
5.6%, 25.4%, 41.7%, 62.1%, and 80.0% of that gap. Adding just 350 labeled
target-domain examples in total, 50 per class, only 9.7% of the source
training set's size, recovers 80% of the gap.

## 1. The Problem: Why WiFi-CSI Breaks When the Environment Changes

WiFi-CSI-based presence and activity sensing has been an active research
topic for over a decade, appealing precisely because it needs no camera or
wearable, only the physical-layer signal from a router already installed
in the home. The catch is that CSI amplitude responds not just to the
activity but to the physical environment the activity happens in. The same
person doing the same motion can produce a completely different amplitude
scale and fluctuation structure depending on the receiver's automatic gain
control (AGC) setting, the distance between antenna and body, and the
multipath reflection pattern created by room size and furniture layout. A
classifier trained in one environment is repeatedly reported to degrade
sharply when moved to another, and this is one of the central obstacles to
real deployment. It is also why a line of work including Widar3.0 (Zheng
et al., 2019) has tried to design "environment-independent" features in
the first place.

This paper asks two questions. First, can the widely cited "breaks when the
environment changes" phenomenon actually be measured on our experimental
harness. Second, if it can, how much of that loss can be recovered by
collecting a small amount of labeled target-domain data and adding it to
the training set, i.e. by giving the installer a short on-site calibration
step. The second question matters more operationally: re-labeling at
camera-system scale every time a new room is added is unrealistic, but an
installer spending a few minutes repeating a handful of prescribed motions
is not. A measured answer to "how many repetitions is enough" is the goal
of this paper.

## 2. Method: Domain Splits and Zero-Shot vs. Few-Shot Calibration

The experimental skeleton evaluates a source-trained classifier on a target
domain under three conditions. Zero-shot uses no target-domain labels at
all: the classifier trained on the source is applied to the target as is.
Few-shot calibration draws N examples per class (N in {1, 5, 10, 20, 50})
from a portion of the target domain set aside for calibration, adds them to
the source training set, and retrains. The upper bound trains on the
target-domain calibration data alone, with no source data at all, to
measure how far a classifier could go if it fully committed to a
target-specific model using as much target data as this protocol ever
provides.

To keep the measurement fair, each repeat (12 repeats total, stratified
random resampling) splits the target domain into a 70% calibration pool and
a 30% held-out evaluation fold. The evaluation fold is never used for
training under any condition. Zero-shot, few-shot, and the upper bound are
all scored on the same evaluation fold within a repeat, so the three
numbers are directly comparable. Few-shot draws always come from the
calibration pool; when a class has fewer than N examples left in the pool,
we take however many are available and log the actual count honestly
(this capping only occurred in the official-split experiment described
below, not in this paper's main pseudo-session experiment). The feature
scaler (StandardScaler) is always fit on that experiment's source data only
and merely applied, never refit, to the target domain. Refitting
normalization on target statistics would itself be a form of domain
adaptation, and the point of this experiment is to measure, in isolation,
how much is recovered purely by adding a handful of labels.

The classifier reuses, unmodified, the 158-dimensional classical CSI
feature set from the classical WiFi-CSI activity-sensing pipeline
(per-subcarrier amplitude mean/variance/skewness/kurtosis, inter-antenna
amplitude-difference variance, STFT band energy of the window's dominant
principal component, Hilbert envelope statistics, autocorrelation,
spectral and histogram entropy) together with a LightGBM multiclass
classifier. What this paper tests is not a new feature set or model but how
the same pipeline behaves when the domain shifts, and how much a handful of
labels fixes that, so feature extraction was reused rather than
reimplemented. Models retrained per repeat (few-shot, upper bound) use 150
trees and 15 leaves, lighter than the original activity-classification
setting (300 trees, 31 leaves), because the total repeat count (12 repeats
times 3 domains times 6 conditions) is large; a preliminary check confirmed
this reduction does not materially change accuracy.

## 3. Data and Setup: What Split Was Actually Available

This is the section where honesty matters most. UT-HAR is a public CSI
activity dataset collected by Yousefi et al. (2017) with an Intel 5300 NIC
(3 antennas by 30 subcarriers = 90 amplitude channels), and this experiment
uses the train (3977)/val (496)/test (500) split exactly as redistributed
by the SenseFi benchmark (Yang et al., 2023). The problem is that this
redistribution publishes no room number, subject ID, or recording
date/time. In other words, there is no information anywhere in the files
about which room, which person, or which day a given window came from.
Under these conditions, constructing a verified cross-room, cross-subject,
or cross-day split is not possible, and this paper does not claim to have
made one.

The first thing we tried was the only grouping variable that does exist in
the data: the official train/val/test boundary, used as a domain-shift
proxy. We trained on train and applied the classifier zero-shot to val and
to test. The result was completely different from what we expected: 94.91%
accuracy on val and 94.67% on test, essentially matching, within one
standard deviation, the pipeline's original in-split 7-way accuracy of
95.2%. In other words, crossing the official split boundary barely moved
accuracy at all. This result is itself important information. The SenseFi
paper states, in its own words, that segmenting with a sliding window
"inevitably" causes repeated data among samples, and our zero-shot result
reproduces exactly that caveat as a measurement: there is no evidence that
val and test were collected under physically different conditions from
train; if anything they behave as if they were cut out of the same
continuous recording. Drawing a few-shot recovery curve on top of this
split would be meaningless, because there is essentially no gap to
recover (Section 4 shows the recovery figures bouncing between -6% and
+2%, i.e. noise around zero). Interestingly, the "upper bound" condition
(trained on target-only data) scored lower than zero-shot (76.73% on val,
75.89% on test), but this is not evidence of a real domain gap; it is a
plain sample-size effect from training on only about 350 examples instead
of nearly 4000. We are explicit that this number should not be read as
"few-shot calibration makes things worse."

Once it was clear the published metadata could not support a real
domain-shift measurement, two options remained: abandon the domain-shift
experiment and report only the negative finding, or construct an honestly
labeled proxy axis ourselves. We chose the latter. Pooling train, val, and
test into 4973 windows, we computed each window's per-channel mean
amplitude (90 dimensions, computed directly from the raw signal, separate
from the 158-dimensional classifier feature set) and applied k-means
clustering (k=2). Channel-mean amplitude is treated in the CSI literature
as a physical proxy for receiver gain and multipath, so windows that end up
in the same cluster are more likely to share a physical recording
condition, and windows in different clusters are more likely not to. The
larger cluster contained 3624 windows and the smaller 1349, and both
clusters covered all 7 activity classes (per-class counts in the smaller
cluster range from 90 for the sit-down/stand-up pair to 447 for pickup).
We designated the larger cluster as source and the smaller as target.

We do not hide the limits of this construction. It is not a verified room,
subject, or day label, it is a cluster inferred by unsupervised clustering.
Whether the two clusters actually correspond to different rooms, different
subjects, different recording sessions, or some combination cannot be
determined from this data alone. Nor is the clustering fully independent of
the classification feature set, since several of the 158 classifier
features are themselves aggregates of channel mean. What supports treating
this as a genuine shift, rather than an artifact we manufactured, is the
shape of the result itself: zero-shot accuracy drops sharply, and it climbs
smoothly and monotonically as more target-domain data is added, a pattern
that random noise does not produce. We refer to this proxy as
"pseudo-session" throughout, and never as cross-room or cross-subject.

## 4. Results

The table below reports the mean and standard deviation over 12 repeats
(fixed random seeds, stratified resampling each time). "Recovery" is
(few-shot accuracy minus zero-shot accuracy) divided by (upper-bound
accuracy minus zero-shot accuracy), times 100, i.e. the share of the
zero-shot-to-upper-bound gap that few-shot calibration recovers.

| Condition | pseudo-session (constructed shift) | official test (control) |
|---|---|---|
| Zero-shot accuracy | 55.08% (SD 1.82pp) | 94.67% (SD 1.72pp) |
| N=1 accuracy / recovery | 57.16% / 5.6% | 94.56% / 0.6% |
| N=5 accuracy / recovery | 64.55% / 25.4% | 94.67% / -0.0% |
| N=10 accuracy / recovery | 70.62% / 41.7% | 95.17% / -2.7% |
| N=20 accuracy / recovery | 78.23% / 62.1% | 95.06% / -2.1% |
| N=50 accuracy / recovery | 84.92% / 80.0% | 95.50% / -4.4% |
| Upper bound (target-only) | 92.37% (SD 1.48pp) | 75.89% (SD 2.61pp) |
| Zero-shot-to-upper-bound gap | 37.29pp | -18.78pp (sample-size artifact) |

```chart
{"kind":"line","title":"Few-shot accuracy recovery curve, pseudo-session domain shift","labels":["0 (zero-shot)","1","5","10","20","50","full pool (upper bound)"],"series":[{"name":"Accuracy","values":[0.5508,0.5716,0.6455,0.7062,0.7823,0.8492,0.9237]}]}
```

The curve is smooth and monotonically increasing. Adding just 1 example per
class raises accuracy by 2.08 percentage points; 5 examples raise it by
9.47 points; 10 by 15.54 points; 20 by 23.15 points; 50 by 29.84 points.
Half of the total gap (18.65 points) is crossed somewhere between 10 and 20
shots per class, around 14 shots by linear interpolation. Adding 50
examples per class, 350 labeled target-domain examples in total (only 9.7%
of the 3624-example source training set), recovers 80% of the gap and
brings accuracy to 84.92%. The remaining 20% of the gap (7.45 points) is
not closed within the shot range tested here. Macro-F1 tells a slightly
sharper story: zero-shot macro-F1 is only 43.68%, well below accuracy,
meaning the minority classes (90-106 examples in the small cluster) are
hit especially hard with no calibration. Macro-F1 rises to 82.19% at N=50,
closing most of the gap to accuracy (84.92%), which suggests the small
amount of calibration data lifts minority-class recognition along with the
majority classes, not just the majority classes alone.

```chart
{"kind":"bar","title":"Recovery rate per shot count (%), pseudo-session domain","labels":["1","5","10","20","50"],"values":[5.6,25.4,41.7,62.1,80.0]}
```

The official-split control tells a completely different story. Because its
zero-shot accuracy (94.67%) already sits near the in-split baseline, adding
a handful of examples per class moves recovery between -4.4% and +0.6% with
no clear direction. This does not mean few-shot calibration "does not
work"; it means there was essentially no gap left to recover in the first
place. As explained in Section 3, the lower accuracy of the upper-bound
condition (75.89%) is a sample-size artifact from training on roughly 350
examples, not evidence of a real domain difference. We place this control
next to the pseudo-session result specifically to show how sensitive a
domain-shift measurement is to the choice of split, using the identical
pipeline, model, and repeat protocol throughout.

```chart
{"kind":"bar","title":"Split comparison: zero-shot and upper bound (official test vs. pseudo-session)","labels":["official zero-shot","official upper bound","pseudo-session zero-shot","pseudo-session upper bound"],"values":[0.9467,0.7589,0.5508,0.9237]}
```

The third chart compresses this paper's methodological point into one
figure. The official split shows zero-shot and the upper bound at almost
the same height (with the upper bound even lower, from the sample-size
effect), visually confirming there is no domain shift to measure there. The
constructed split shows zero-shot dropping sharply and the upper bound
sitting far above it, i.e. an axis that actually has something to measure.
This contrast is the most direct answer to why this paper abandoned its
originally planned split and built a new one instead.

## 5. Limitations

The domain shift reported here is not a verified cross-room,
cross-subject, or cross-day split. UT-HAR's SenseFi redistribution
publishes no room, subject, or timestamp metadata, and we have not hidden
that absence. The pseudo-session split is derived from unsupervised
clustering on per-channel mean amplitude, and whether the two clusters
actually reflect different rooms, different subjects, or an AGC reset from
equipment being restarted cannot be determined from this data alone. The
shape of the result, a smooth monotonic recovery curve, is circumstantial
evidence that the clustering captured real structure rather than noise, not
proof of it.

Second, the channel-mean amplitude used for clustering is not fully
independent of the 158-dimensional classifier feature set, since several of
those features are themselves aggregate statistics of the channel mean. We
cannot fully rule out that part of the observed gap comes from the
clustering criterion and the classification features partially overlapping
rather than from a genuine environmental difference. That said, both
clusters contain the full set of 7 activity classes, and class imbalance
alone is unlikely to explain a drop to 55% zero-shot accuracy, so we judge
this concern insufficient to invalidate the overall result.

Third, this experiment uses a single public dataset, a single
classification pipeline (classical features plus LightGBM), and a single
clustering method (k-means with k=2). A different dataset, more clusters,
or a deep-learning domain-adaptation method could change the shape of the
recovery curve or the number of shots required. This paper does not claim
a universal constant for "how many shots are enough"; it reports one
measured case for this specific pipeline on this specific data.

Fourth, the minority classes (90-106 examples in the smaller cluster) have
enough repeats to average out but not enough to decompose per-class
recovery speed separately, which this paper does not attempt.

Fifth, the "upper bound" is only the accuracy achievable from
target-domain data alone; it is not a true theoretical ceiling. Collecting
more target-domain data, or applying a more sophisticated domain-adaptation
technique (feature alignment, adversarial training, etc.) that uses source
and target together, could raise this ceiling further.

## 6. Reproduction

Data comes from UT-HAR (Yousefi et al., 2017) as redistributed by the
SenseFi benchmark (Yang et al., 2023): three numpy arrays for
train/val/test (X and y each), 250-step by 90-channel windows (3 antennas
by 30 subcarriers), 7 activity classes (bed/fall/pickup/run/sitdown/
standup/walk, alphabetical-order convention).

Feature extraction reuses, unmodified, the 158-dimensional handcrafted
feature function from the original classical CSI activity-classification
script (per-subcarrier mean/variance/skewness/kurtosis, whole-channel
aggregate statistics, inter-antenna amplitude-difference variance,
principal-component STFT band energy, Hilbert envelope statistics,
short-time energy peakiness, autocorrelation, spectral and histogram
entropy, global energy indicators). Features are computed per window
independently, so no split introduces cross-sample leakage.

The official-split experiment trains a LightGBM multiclass classifier (150
trees, 15 leaves, learning rate 0.09) on the full train split (3977
windows) and applies it to val (496) and test (500) separately. The
constructed-split experiment pools train, val, and test into 4973 windows,
standardizes each window's 90-dimensional channel-mean amplitude, applies
k-means (k=2, seed 0, n_init=10), and designates the larger cluster (3624)
as source and the smaller (1349) as target. Both experiments split the
target domain into a stratified 70% calibration pool and 30% evaluation
fold on every repeat (12 repeats, seeds 1000 through 1011), and score
zero-shot, few-shot (1/5/10/20/50 shots per class), and the upper bound on
the same evaluation fold. The feature scaler is fit on each experiment's
source data only.

The full pipeline runs on Python (numpy/scipy/scikit-learn/LightGBM),
CPU-only, with no GPU or cloud resources required. Total run time,
including feature extraction, is about 5 minutes for 12 repeats across the
3 domains.

## References

1. S. Yousefi, H. Narui, S. Dayal, S. Ermon, S. Valaee, "A Survey on
   Behavior Recognition Using WiFi Channel State Information," IEEE
   Communications Magazine, vol. 55, no. 10, 2017 (original UT-HAR
   collection).
2. J. Yang, X. Chen, D. Wang, H. Zou, C. X. Lu, S. Sun, L. Xie, "SenseFi: A
   Library and Benchmark on Deep-Learning-Empowered WiFi Human Sensing,"
   Patterns (Cell Press), vol. 4, no. 3, 2023 (source of the redistributed
   split used here).
3. Y. Zheng, Y. Zhang, K. Qian, G. Zhang, Y. Liu, C. Wu, Z. Yang,
   "Zero-Effort Cross-Domain Gesture Recognition with Wi-Fi," Proceedings of
   ACM MobiSys, 2019 (representative work on cross-environment
   generalization in WiFi sensing).
4. G. Ke et al., "LightGBM: A Highly Efficient Gradient Boosting Decision
   Tree," Advances in Neural Information Processing Systems (NeurIPS),
   2017.
5. F. Pedregosa et al., "Scikit-learn: Machine Learning in Python," Journal
   of Machine Learning Research, vol. 12, 2011 (StandardScaler, KMeans, and
   train_test_split used for preprocessing, clustering, and splitting).
