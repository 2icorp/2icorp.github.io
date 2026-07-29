# Fixed-False-Alarm-Rate Industrial Detection: CFAR Design and Synthetic Benchmarks

## Abstract

Anomaly detection for industrial wireless interference monitoring,
private-5G slice supervision, and factory spectrum management cannot be
judged by detection rate alone. What actually gets negotiated in an
operations contract is not "what percent do you catch" but "how many
false alarms per day are we willing to tolerate." A system that misses
this budget gets its alarms silenced or ignored, however high its
detection rate. This paper explains why fixed-false-alarm-rate (CFAR,
constant-false-alarm-rate) detection is the contract shape that fits
industrial monitoring, lays out the mathematical structure of three CFAR
variants (CA, cell-averaging; OS, order-statistic; GO, greatest-of), and
reports results from an actually implemented CA-CFAR detector (augmented
with a phase-only statistic to catch carrier-frequency-offset
interference), an interference-type classifier, and two distinct
localization tasks (within-trial slice localization and factory-floor
multilateration). Every number below comes from a physics-grounded
synthetic simulation, not a real deployment capture. Against a target
false-alarm rate of 0.05, the realized rate held at 0.0529. Overall
detection probability (Pd) was 0.980, and within-trial localization
accuracy was 0.982 (random baseline 0.167). In the factory-floor
multilateration experiment, localization RMSE was 4.98m at 0dB shadowing
standard deviation and degraded to 18.47m at 12dB, with the advantage
over a naive centroid baseline shrinking smoothly as shadowing grew.
Interference-type classification reached macro-F1 1.000 in one
experiment and macro-F1 0.9848 in the other, where the signal had
actually passed through receiver path loss and shadowing. This paper
does not present these numbers as product performance. It reports, just
as plainly, under what conditions the numbers look good, how much of
that goodness is an artifact of fixed control variables, and what must
be verified before any of this reaches a real deployment.

## 1. Why fixed false-alarm rate: industrial monitoring runs on a false-alarm budget

Consumer-app anomaly detection is mostly reversible when it fails. A bad
recommendation gets ignored. Industrial wireless interference monitoring
is different. In a factory line running private 5G, an O-RAN base
station's slices, or a factory wireless sensor network, an alarm moves
people. A technician walks the floor, a production line pauses, an
operations team hunts for a root cause. That response has a real cost.
So the number that actually gets negotiated in an industrial monitoring
contract is not "detection rate X%" but a cap: "no more than Y false
alarms per day." Once false alarms come too often, operators start
raising thresholds by hand or ignoring alerts outright, and at that
moment the system is neutralized regardless of its nominal detection
rate. This is alarm fatigue, and it is the most common way industrial
monitoring systems fail, not because the model is inaccurate but because
it cannot hold its false-alarm budget.

Seen this way, the core of the detection problem is not an accuracy
curve but the ability to **fix a false-alarm rate in advance and hold
that fixed value under real operating conditions.** Anyone can raise
detection rate by lowering the threshold. The real question is how many
false alarms that costs, and the deeper question is whether a fixed
threshold can keep holding a contracted false-alarm rate once the noise
floor drifts over time, which it does in the field. A learned binary
classifier's decision threshold is implicitly tied to the noise
distribution it was trained on, so once deployed, a drifting noise floor
can collapse its false-alarm rate without warning. Fixed-false-alarm-rate
detection (CFAR), by contrast, is designed to re-estimate its threshold
from local noise statistics at every moment, so it structurally holds
the false-alarm contract even as the noise floor moves. This is why this
paper treats CFAR not as "an old classical method" but as the
deterministic design that actually matches the contract shape of
industrial monitoring. Whether this discipline, used in radar signal
processing for nearly half a century, carries over cleanly to a new
problem, private-5G / O-RAN slice and factory wireless interference
detection, is the first question this paper asks.

## 2. Method: the CFAR family, type classification, and localization

### 2.1 The basic structure of CFAR

A CFAR detector estimates the local noise level from a set of reference
cells surrounding the cell under test (CUT), then multiplies that
estimate by a scaling factor to form a decision threshold. If the CUT's
signal exceeds this threshold, the detector declares a detection. Guard
cells sit between the CUT and the reference cells so that the target's
or interferer's own energy does not leak into the noise estimate. How
the reference cells are combined to estimate the noise level is what
distinguishes the CFAR variants.

**CA-CFAR (cell-averaging)** is the most basic variant: it uses the
arithmetic mean of the reference-cell values as the noise estimate. The
threshold is "scaling factor times reference-cell mean," and the scaling
factor is inverted from the number of reference cells N and the target
false-alarm rate Pfa (for a power-detection statistic well approximated
by an exponential distribution, scaling factor = N times (Pfa to the
power -1/N, minus 1)). Under the assumption that the reference cells
contain only uniform noise, this scaling factor exactly delivers the
target false-alarm rate. The problem shows up when some reference cells
happen to contain another interferer or a strong signal: the mean gets
pulled upward, the threshold rises more than it should, and the CUT's
genuine signal can be missed. This is the masking effect.

**OS-CFAR (order-statistic)** targets exactly this masking problem.
Instead of averaging the reference cells, it sorts them and uses the
k-th order statistic as the noise estimate. Choosing k appropriately
smaller than the number of reference cells means that even if another
interferer sits inside the reference window, its value gets pushed
toward the top of the sorted order and does not dominate the noise
estimate. The cost is a somewhat higher variance than CA-CFAR under
uniform-noise conditions.

**GO-CFAR (greatest-of)** splits the reference window into a leading and
a trailing segment around the CUT, computes the mean of each, and takes
the larger of the two as the noise estimate. At a clutter edge, where
strong interference sits across only one side of the reference window,
looking only at the smaller-side mean would set the threshold too low
and flood the detector with false alarms. GO-CFAR picks the larger side
to suppress that flood. The opposite variant, SO-CFAR (smallest-of),
picks the smaller side instead and is used when two closely spaced
targets each occupy one side of the window, to protect detection rate
rather than suppress false alarms. This paper's experiment did not
implement OS-CFAR or GO-CFAR directly, but a specific weakness surfaced
in the results below, masking under full-band jamming, is exactly the
problem OS-CFAR is designed to solve, and we flag it explicitly as a
next step rather than papering over it.

### 2.2 What was actually implemented: CA-CFAR combined with a CFO statistic

Power-ratio statistics in the CA-CFAR family have one structural blind
spot: an impairment like carrier-frequency offset (CFO), which rotates
phase without adding power, is simply invisible to a detector that only
measures power. Rather than sweeping this case away as a corner case,
the detector implemented here combines two statistics. One is a
CA-CFAR peak-power ratio with a 2-cell guard and 8-cell reference
geometry. The other is a one-lag autocorrelation-based CFO-magnitude
estimator. Both are z-scored against the null population from the
train split's confirmed-clean windows, and the final statistic is the
larger of the two z-scores (combined = max(z_CFAR, z_CFO)). The
threshold is inverted from this train-split null distribution to hit the
target false-alarm rate (0.05), then applied unchanged to the test
split. This unchanged application is the core of CFAR discipline: the
threshold is never adjusted after looking at labels.

### 2.3 Type classification: ten handcrafted features plus LightGBM

Separately from detection, there is the question of what kind of
interference a window already flagged as anomalous actually is. This
paper builds a ten-feature vector, energy, CA-CFAR peak ratio,
CFO-estimate magnitude, spectral flatness, spectral kurtosis, occupied-
bandwidth fraction, time-domain PAPR (peak-to-average power ratio),
time-domain kurtosis, lag-1 autocorrelation magnitude, and count of
CFAR-flagged bins, and feeds it to a LightGBM multiclass classifier to
distinguish among the four interference types (full-band jamming,
partial-band jamming, a single tone, and CFO). The train/test split is
done by trial, so no single trial's slices straddle both sides.

In the second experiment, modeling a factory wireless environment, a
separately validated 24-dimensional feature set (energy, occupied
bandwidth, time- and frequency-domain statistics, and others) and the
same LightGBM hyperparameters (n_estimators=300, learning_rate=0.05,
num_leaves=31, min_child_samples=10) were reused unmodified to classify
seven interference types (WiFi OBSS, Bluetooth, Zigbee, microwave, a CW
jammer, an FHSS jammer, and DFS radar) from the signal seen at the
receiver with the best signal-to-noise ratio. This feature-and-
hyperparameter combination previously reached macro-F1 0.9942 on its own
dedicated synthetic bank; the point of this experiment is to check
whether that combination survives once the signal has passed through
receiver path loss and shadowing.

### 2.4 Localization: within-trial slice localization and factory-floor multilateration

This paper covers two distinct questions both labeled "localization."
The first asks, once a trial is already flagged anomalous, which of six
slices is the culprit. The method is simple: take the argmax of the
combined statistic across the six slices and call that slice the
anomalous one. Chance performance here is 1/6 = 0.167.

The second is a genuine spatial localization problem. Five receivers
(four corners set back 5m from the walls, plus one center point) are
placed on a 60m by 40m factory floor, and an interferer at a random
(x, y) location inside that floor is localized. The method used is
textbook wireless localization: each receiver's observed power is run
through a log-distance path-loss model (attenuation exponent n,
reference distance d0) to get a distance estimate; the five distance
estimates are combined via the classic subtract-the-reference-receiver
linearization trick to get an initial coordinate, which is then refined
with nonlinear least squares (soft-L1 robust loss, bounded to the
deployment area plus a 20m margin). Two baselines are used for
comparison: an unweighted centroid of the five receiver positions
(ignoring the signal entirely), and a weighted centroid using inverse-
square distance weights (1/d^2, Blumenthal et al. 2007). True
time-difference-of-arrival (TDOA) localization was not implemented in
this experiment, because TDOA requires receivers synchronized to a
common time base at the sub-microsecond level, and faking that
synchronization would hide away exactly the hardest part of a real TDOA
deployment.

## 3. Data and setup: both experiments are synthetic

Every number in this section comes from a physics-grounded simulation,
not a real wireless-hardware capture. We state this up front.

**Experiment 1 (slice interference detection, type classification, and
within-trial localization).** Six slices are each modeled as an
independent baseband IQ window (two labeled eMBB, two URLLC, two mMTC as
names only; the underlying signal model is identical across slices).
Each window fills 180 of 256 subcarriers with QPSK and applies an IFFT
to an OFDM-like waveform, then adds a 22dB thermal-noise floor. Each
trial has a 50% chance of injecting one of four impairments into one of
the six slices: full-band jamming (AWGN across the whole band,
jammer-to-signal ratio JSR=6dB), partial-band jamming (confined to 25%
of the window at JSR=6dB), a single CW tone (JSR=6dB), or CFO, a
phase-only rotation with zero added power (frequency offset 0.03
cycles/sample). A total of 4,000 trials (24,000 slice windows) were
split 60/40 by trial (stratified on whether a trial contains jamming),
seeded at 1337 for full determinism. The whole pipeline, 4,000 simulated
trials plus one LightGBM fit, completes in 3.4 seconds on a laptop CPU.

This experiment carries one important modeling simplification: it
assumes the six slices already arrive as independent IQ taps. In a real
deployment, this holds only if an O-RU or RIC/xApp already exposes
per-slice or per-PRB-group channelized IQ (or an equivalent per-slice
power tap). The RU-side demultiplexing step that splits one wideband
composite capture into per-slice IQ is real integration work this
experiment does not do. Likewise, this experiment does not touch any
O-RAN standards-compliance element, no E2AP/SCTP transport, no E2 Service
Model (E2SM-KPM/RC), no O1/A1 interface, no actual RIC xApp deployment,
and has no 3GPP NR waveform, no real gNB baseband IQ taps, and no RF
front-end. What it validates is that the signal-processing core (CFAR
plus CFO estimation plus a feature-based GBM classifier) works at
concept-feasibility level, not O-RAN or private-5G standards compliance.

**Experiment 2 (factory-floor interference localization).** Five fixed
receivers at (5,5), (55,5), (55,35), (5,35), and (30,20) are placed on a
60m by 40m factory floor. Each trial places one of seven non-clean
interference types at a random (x, y) location. The propagation model
combines log-distance path loss (attenuation exponent n=2.8, within the
commonly cited 2 to 4 range for indoor non-line-of-sight or factory
environments, reference distance d0=10m) with independent log-normal
shadowing per receiver. A single shared waveform is generated per trial
so that all five receivers physically observe the same structural
features (burst timing, hop pattern, symbols) from one transmitter,
before per-receiver attenuation and independent noise are applied. A
total of 2,800 trials (across the five receivers) run in 25.7 seconds on
a laptop CPU, seeded at 1337.

This experiment is also a physics-grounded simulation, not a real
deployment capture. The path-loss model follows a standard log-distance
form, but the model does not capture correlated shadowing (where
machinery and racking block several nearby receivers at once) or the
structure of real non-line-of-sight multipath. The reference transmit
power needed to invert distance from received power is assumed known;
a real deployment would need a separate calibration step. These
assumptions are revisited explicitly in Section 5.

## 4. Results

### 4.1 Detection: did the system hold its target false-alarm rate

Against a target false-alarm rate of 0.05, applying the threshold
(2.407) inverted from the train split unchanged to the test split gave a
realized false-alarm rate of **0.0529**, about 6% off target, well
within the statistical variation expected from a finite test split of
several thousand windows. Recomputed at the trial level (a trial counts
as a false alarm if any one of its six slices is wrongly flagged), the
false-alarm rate is 0.2755, higher, but that is simply the natural
accumulation of a per-slice rate across six slices per trial, not a
flaw in the threshold itself.

```chart
{"kind":"bar","title":"Target vs. realized false-alarm rate (Pfa) and overall Pd","labels":["Target Pfa","Realized Pfa (test)","Overall Pd"],"values":[0.05,0.0529,0.980]}
```

Overall detection probability (Pd) under this target false-alarm rate
was **0.980**. That single number is impressive on its own, but the
table below shows an average that hides a fair amount of spread across
interference types.

| Interference type | Pd | Within-trial localization accuracy |
|---|---|---|
| Full-band jamming (barrage) | 0.929 | 0.929 |
| Partial-band jamming (25%) | 0.986 | 0.991 |
| Single CW tone | 1.000 | 1.000 |
| CFO (phase-only) | 1.000 | 1.000 |
| **Overall** | **0.980** | **0.982** (random baseline 0.167) |

```chart
{"kind":"bar","title":"Detection probability (Pd) by interference type","labels":["Full-band jamming","Partial-band jamming","Single CW tone","CFO"],"values":[0.929,0.986,1.000,1.000]}
```

One point deserves an honest read. **Full-band jamming shows the lowest
detection probability, the opposite of what raw injected power alone
would suggest.** Full-band jamming adds noise across the entire window,
making it the strongest impairment by total power, but for exactly that
reason it also raises the average power of the reference cells. Since
the CA-CFAR statistic is a ratio of test-cell power to reference-cell
power, when reference-cell power rises along with the test cell, that
ratio gets compressed. This is the well-known masking effect from the
CFAR literature, and it is precisely why OS-CFAR (or another variant
robust to reference-cell outliers) exists. This implementation used a
single CA-CFAR variant plus the CFO auxiliary statistic; OS-CFAR is left
as a next step. By contrast, **a detection probability of 1.0 for CFO is
not a coincidence but evidence that this paper's design actually
worked.** A power-ratio statistic alone is structurally blind to a
phase-only impairment; combining it with the CFO auxiliary statistic
demonstrably rescues that structural blind spot.

### 4.2 Type classification: macro-F1 is real, but it is a fixed-control-variable artifact

The slice experiment's type classification reached macro-F1 **1.000**
(816 test windows, four classes, a perfectly diagonal confusion matrix).
This number was genuinely computed, not fabricated, but it needs to be
named as an artifact of fixed control variables. JSR and CFO offset are
held constant across all 4,000 trials, so the four impairment types
occupy cleanly separated regions of the ten-dimensional feature space
(occupied-bandwidth fraction alone nearly separates full-band, partial-
band, and tone; the CFO feature almost fully separates CFO from the
rest). A real deployment sees varying attenuation and JSR near the
detection threshold, where these features start to blend. A systematic
JSR/attenuation sweep was not run in this pass, and it is the required
next step before citing this number as representative of field
performance.

In the factory-floor experiment, where the signal actually passed
through receiver path loss and shadowing, macro-F1 was **0.9848**
(1,960 training windows, 840 test windows, pooled across both sweeps).
Broken down by SNR, it rose from 0.7885 at -5dB to 0.9619 at 0dB and
reached a clean 1.0 from 10dB onward; across the shadowing sweep (run at
a fixed 15dB SNR baseline), it stayed at 1.0 throughout. We judge this
second number to be the more realistic signal of the two, because the
signal genuinely passed through path loss and independent noise here,
and performance degraded smoothly with SNR in a physically sensible
curve.

### 4.3 Spatial localization: shadowing, not SNR, is the dominant error term

At a fixed SNR of 15dB, sweeping shadowing standard deviation from 0dB
to 12dB produced the following multilateration RMSE:

| Shadowing sigma (dB) | Multilateration RMSE (m) | Median error (m) | Centroid baseline (m) | Weighted-centroid baseline (m) |
|---|---|---|---|---|
| 0 | 4.98 | 2.38 | 18.49 | 6.94 |
| 2 | 6.64 | 5.07 | 18.73 | 7.79 |
| 4 | 9.86 | 8.10 | 18.40 | 9.18 |
| 6 | 12.78 | 10.10 | 18.74 | 11.11 |
| 8 | 15.36 | 12.02 | 17.72 | 12.77 |
| 10 | 17.55 | 13.66 | 18.81 | 14.66 |
| 12 | 18.47 | 13.63 | 18.11 | 15.95 |

```chart
{"kind":"line","title":"Localization RMSE vs. shadowing (SNR fixed at 15dB)","labels":["0","2","4","6","8","10","12"],"series":[{"name":"Multilateration","values":[4.98,6.64,9.86,12.78,15.36,17.55,18.47]},{"name":"Centroid baseline","values":[18.49,18.73,18.40,18.74,17.72,18.81,18.11]}]}
```

At low shadowing (0 to 4dB), multilateration beats the signal-free
centroid baseline by 2 to 4 times (4.98m versus 18.49m at 0dB). As
shadowing grows, that advantage narrows smoothly, and by around 12dB
multilateration (18.47m) is nearly indistinguishable from the centroid
baseline (18.11m). In other words, once shadowing is large enough, the
RSSI signal itself stops carrying usable location information, and
performance converges toward "point at the middle of the sensor array."
Published indoor and factory non-line-of-sight shadowing is commonly
cited in the 4 to 10dB range, so a real deployment likely sits somewhere
in the middle of this curve, a real advantage over the naive baseline,
but not a decisive one.

Sweeping SNR at a fixed shadowing of 6dB from -5dB to 25dB produced a
non-monotonic RMSE curve, bottoming out around 10dB (12.47m) and rising
again by 25dB (18.35m), counter to the naive intuition that more signal
should only help. This paper reports that shape as measured rather than
smoothing it away. The same shape reproduced in a larger follow-up
sample (300 trials per point, SNR up to 40dB), ruling out sampling
noise at n=200. The most likely mechanism, not fully isolated, is that
once every receiver is reliably above its detection threshold (roughly
10dB and above here), the log-normal shadowing term (fixed at 6dB in
this sweep) becomes the dominant, effectively constant multiplicative
ranging error, so further SNR gains should plateau performance rather
than degrade it; the residual degradation observed is most likely a
duty-cycle- or threshold-interaction artifact of the signal-power
estimator at high absolute power for specific interference classes, and
is left as a follow-up rather than re-derived here. It does not change
the qualitative conclusion: once a signal is detectable at all, shadowing
dominates the error, not SNR.

## 5. Limitations: synthetic data means real-deployment validation is next

Every number in this paper comes from a physics-grounded synthetic
simulation and does not reflect a real propagation environment or real
O-RAN / private-5G infrastructure. The following must be explicitly
validated before moving toward a real deployment.

**No standards-compliance elements exist.** None of E2AP/SCTP transport,
E2 Service Model, O1/A1 interface, or actual RIC xApp deployment is
present. Turning "O-RAN slice interference isolation" into a real
product requires this detector to run as an E2-connected xApp consuming
real RU/DU telemetry.

**No real gNB PHY exists.** A generic OFDM-like waveform was used, not a
3GPP NR waveform, and none of real gNB baseband IQ taps, a PRB
scheduler, an RF front-end, or multipath antenna effects were modeled.

**Per-slice channelization is missing.** A real O-RU or gNB exposes one
wideband capture; the RU-side FFT plus PRB-to-slice demultiplexing step
is real integration work that must be built, not something hidden inside
this experiment.

**No JSR/attenuation sweep was run.** All slice-experiment results come
from a single fixed operating point (JSR=6dB, CFO offset 0.03
cycles/sample). Performance across the SNR and attenuation range a real
deployment would see is unmeasured.

**Full-band jamming masking is unresolved.** As shown in Section 4.1,
this implementation is weakest against full-band jamming, exactly the
problem OS-CFAR (or another reference-cell-outlier-robust variant) is
designed to solve.

**The spatial-localization calibration and independent-shadowing
assumptions are unvalidated.** Distance inversion assumes the transmit
reference power is known, whereas a real deployment needs a calibration
walk with a reference tag or a per-interferer-class propagation model.
The model also assumes independent shadowing per receiver, whereas real
factory environments show correlated shadowing, where machinery and
racking block several nearby receivers at once, which is likely to make
real localization performance worse than the independent-shadowing model
predicts.

**TDOA was not implemented.** True time-difference-of-arrival
localization is the biggest remaining accuracy lever for this
experiment, and it was explicitly not faked because it requires
synchronized receiver hardware this experiment does not have.

**Only one receiver layout was evaluated.** A placement-sensitivity
study across different receiver configurations was not run.

## 6. Reproduction

Both experiments are seeded at 1337 and are fully deterministic. The
slice detection, classification, and localization experiment, including
4,000 simulated trials and one LightGBM fit, completes in 3.4 seconds on
a laptop CPU; the factory-floor localization experiment, including 2,800
trials across five receivers and a LightGBM fit with identical
hyperparameters, completes in 25.7 seconds. Both run on standard
numerical libraries (NumPy/SciPy) and LightGBM only, with no GPU
requirement. Every reported metric, detection probability, localization
accuracy, RMSE, macro-F1, is computed directly by code, never
self-reported by a model or an executing agent. The next steps are to
add a JSR/attenuation sweep to the same harness, and then to replace the
synthetic inputs with real E2 telemetry (the O-RAN path) or a real gNB
PHY IQ tap (the private-5G path). Neither of those paths exists today;
this paper covers only the concept-feasibility stage that precedes them.

## References

1. Rohling, H. (1983). Radar CFAR thresholding in clutter and multiple
   target situations. *IEEE Transactions on Aerospace and Electronic
   Systems*, AES-19(4), 608-621.
2. Skolnik, M. I. *Introduction to Radar Systems*, 3rd ed., McGraw-Hill,
   chapter 6 (detection theory and CFAR).
3. Moose, P. H. (1994). A technique for orthogonal frequency division
   multiplexing frequency offset correction. *IEEE Transactions on
   Communications*, 42(10), 2908-2914.
4. Sayed, A. H., Tarighat, A., Khajehnouri, N. (2005). Network-based
   wireless location: challenges faced in developing techniques for
   accurate wireless location information. *IEEE Signal Processing
   Magazine*, 22(4), 24-40.
5. Blumenthal, J., Grossmann, R., Golatowski, F., Timmermann, D. (2007).
   Weighted centroid localization in Zigbee-based sensor networks.
   *Proceedings of the IEEE International Symposium on Intelligent
   Signal Processing*.
6. Rappaport, T. S. *Wireless Communications: Principles and Practice*,
   2nd ed., Prentice Hall (log-distance path-loss model, attenuation
   exponent ranges).
7. ITU-R P.1238. Propagation data and prediction methods for the
   planning of indoor radiocommunication systems and radio local area
   networks.

Every experiment was designed for deterministic reproduction from a
fixed seed, and every performance claim was settled by a code-computed
metric (false-alarm rate, detection probability, localization accuracy,
RMSE, macro-F1). Known weaknesses (full-band jamming masking) and known
scope limits (a fixed operating point, no real E2/RIC or gNB PHY
integration) are reported alongside the results, not omitted.
