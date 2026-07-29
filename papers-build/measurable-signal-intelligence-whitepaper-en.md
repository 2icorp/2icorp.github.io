# Measurable Signal and Decision Intelligence: One Measurement Logic, Many Industries

## Executive Summary

This whitepaper ties together 16 technical papers 2i has produced into a single business
thesis. The papers span six industry clusters that look nothing alike on the surface -
media, sensing, industrial, security, edge/AI infrastructure, and finance. A broadcaster
wants to know which track in a catalog a short audio clip came from. A factory wants to
know whether a bearing's vibration has drifted outside its normal range. A quant desk
wants to know whether a backtest's out-of-sample performance came from the same
distribution as its in-sample performance. Yet all six questions reduce to the same
underlying structure: extract features from a signal (sound waves, radio-frequency
electromagnetic waves, vibration, time-series returns), then decide whether those
features have drifted outside a known normal, enrolled, or trusted state. This is
anomaly detection, entity identification, and open-set classification wearing different
faces across industries while sharing the same body.

The real thesis running through this document is not the industry expansion itself but
the measurement discipline that makes it trustworthy. Five principles - pre-registration,
shuffle-and-control experiments, fixed-false-alarm-rate comparisons, data-leakage
blocking, and publishing negative results - repeat in different shapes regardless of
domain. The finding that audio fingerprinting accuracy barely degrades when a catalog
grows eightfold and the finding that an uncorrected significance test manufactures false
positives up to 46.7% of the time when parameter search is uncontrolled look unrelated
on their face. Both are answers to the same question: what did we declare we would
measure before running the experiment, and does the result measured that way survive
scrutiny against chance? What 2i sells is not a per-industry algorithm but a disciplined
way of answering that question honestly.

Maturity across the 16 papers is deliberately uneven, and this document does not
flatten that unevenness. Audio content fingerprinting and its sharded index for
catalog scale, device-free WiFi-CSI presence and fall detection, and vibration-based
predictive maintenance have each cleared public, real-measurement validation well
above chance and can support paid pilots or a customer-data revalidation PoC today.
At the opposite end sits open-set RF fingerprint verification: separability is real, but
authentication rates collapse at the low false-alarm-rate operating points access
control actually demands, so selling it as a single hard-authentication gate is not
supported by the evidence. Five papers in edge and AI infrastructure answer the
operational question of whether these models actually run on cheap hardware and
whether their confidence scores can be trusted. One finance paper on backtest
discipline stands apart with its own explicit boundary: this section is research and
methodology, not investment advice.

## 1. Why Measurement Discipline: One Logic, Six Industry Faces

Companies selling AI transformation usually build a different story for every industry -
vision inspection for manufacturing, demand forecasting for retail, content
recommendation for media. This is not wrong, but it misses something. A large share
of problems across unrelated industries ask the same mathematical question under a
different surface. "Is this sound the track we know?" (audio fingerprinting). "Is
someone in this room right now, and did they just fall?" (WiFi sensing). "Did this
signal come from the enrolled device it claims to be, or an unseen one?" (RF
fingerprinting). "Has this bearing's vibration drifted outside its normal range?"
(predictive maintenance). "Did this strategy's out-of-sample performance come from
the same distribution as its in-sample performance?" (backtesting). All five questions
reduce to one form: extract features from a signal, and decide whether the feature
distribution belongs to a known normal or enrolled state.

Once this decision logic is properly built once, it transplants across industries by
swapping the signal source and feature design rather than starting over. The
time-aligned search structure validated for "matching a short query against a long
catalog" in audio fingerprinting becomes the skeleton of RF fingerprinting the moment
the signal type changes from audio to radio-frequency electromagnetic waves. The
approach validated in WiFi-CSI - hand-designed physical features feeding a gradient
boosting classifier - becomes predictive maintenance when the signal source changes
from wireless channel state information to a vibration accelerometer, and becomes
backtest verification methodology when the axis changes to time-series returns. This
is the one body underneath what looks like a different product in every industry.

But this thesis carries a dangerous trap, and this whitepaper names it directly.
"The decision logic is the same" does not mean "the performance is the same." A
decision map that fairly pits classical methods against deep learning across six signal
tasks (modulation classification, fixed-false-alarm-rate interference detection, drone
open-set rejection, channel estimation, RF fingerprint fusion, and co-channel signal
separation) shows that the winning method flips depending on task structure even
under the identical decision logic. On the standard public dataset RadioML2016.10a
(6 dB SNR), the classical route (28-dimensional physical features plus LightGBM,
accuracy 0.855) beat raw-IQ-input deep learning (a transformer, 0.681) by 17.4
percentage points on modulation classification, and this lead held as training samples
grew from 539 to 9,900. Conversely, on interference detection under a fixed
false-alarm-rate requirement, a classical CFAR-family detector held its target
false-alarm rate even as the noise floor wandered by 12 dB, while an unconstrained
binary deep-learning detector's false-alarm rate exploded to 1.0 under the same
condition. Classical methods win where data is scarce and features are physically
interpretable; deep learning wins where data is abundant and representation learning
is itself the task. Saying the same decision logic wears different faces across
industries also means each face has to be re-verified with data. This duality -
identical structure, performance that must be re-measured task by task - is the
methodology running through this entire document, and the next section covers how
that re-measurement happens in stages while minimizing risk.

## 2. The Gauge Method: Measurement, Proof-of-Concept, and Transfer Gates

The most common reason small and mid-sized manufacturers and retailers fail at AI
transformation is not that the model is bad but that there is no sequence. Signing a
large contract first and finding out what actually works afterward means the money is
already spent on whatever turns out not to work. 2i inverts this order. Every project is
split into three gates, each with a pass criterion, and failing a gate means the next
gate's cost is never billed.

The first is the measurement gate. Over two to three weeks, we interview the field
site and look at the data. We answer, with numbers, what the real problem is,
whether a decision logic exists in the signal that can solve it, and if so how much it
saves. If the honest conclusion is "AI is not the answer right now," we report that too.
It runs on a fixed cost, so the initial burden is small.

The second is the proof-of-concept gate. One candidate from the measurement gate is
built and actually run - not a demo, but measured against effect on field data. A cheap
method and an expensive method are placed side by side, and the expensive method is
adopted only when it actually wins. The results across the six industry clusters in
Section 3 are exactly this discipline applied to 16 real measurements. Only what clears
this gate earns the right to be built.

The third is the transfer gate. What was confirmed in the proof-of-concept becomes an
operable system, deployed onto your actual edge hardware and budget. The INT8
quantization result covered in Section 3.5 (quantization-aware training recovering
94.5% of accuracy loss) and the budget attribution result (a promised 40 MSPS on a
single low-cost core landing at a measured 0.19x in reality, broken down stage by
stage in nanoseconds) are exactly the questions that must be repeatedly re-verified at
this gate. The transfer gate proves not "we built it" but "it runs on your hardware and
your budget."

Five measurement disciplines hold up these three gates. Pre-registration means fixing
what will be measured and what counts as success before the experiment runs. Because
the open-set RF fingerprint verification paper declared in advance "we measure
authentication rate at a low false-alarm rate (TAR@FAR), not classification accuracy,"
the metric could not be swapped for a better-looking one after the result came in
poorly. Shuffle-and-control means confirming that a method produces results beyond
chance under conditions where no real signal exists. The backtest discipline paper's
multiple-testing experiment, run on a random walk with true expected return set
exactly to zero, saw the best in-sample Sharpe ratio nearly triple from 0.34 to 0.90 as
the number of tried parameter combinations grew from 5 to 2,000 - purely from
"searching more and having more chances to stumble on something that looks good."
Fixed-false-alarm-rate comparison means pitting cheap and expensive methods against
each other under the same false-alarm budget, exactly what the industrial CFAR
detector experiment did against a target false-alarm rate of 0.05. Leakage blocking is
most dramatically illustrated by the WiFi-CSI cross-environment calibration paper.
Under the official train/val/test split, zero-shot accuracy barely dropped to
94.7-94.9%, and this was not success - it re-confirmed that the benchmark itself
leaks information between samples through sliding-window overlap. Measuring real
domain shift required constructing a verifiable unsupervised cluster split from
scratch, and only there did the collapse to 55.08% surface. Publishing negative results
means not hiding what does not work. The collapse of open-set RF fingerprinting, the
fact that the acoustic axis of predictive maintenance still rests on synthetic data only,
and all three bias mechanisms in the backtest paper are published in this document
alongside the successes.

## 3. Six Industries, One Measurement Discipline

### 3.1 Media and Content: Fingerprinting and Scaling to a Million Songs

Selling broadcast rights monitoring or in-store music licensing audits requires
identifying which catalog track a short audio clip came from within seconds. A
Shazam-style peak-pair hashing algorithm, scaled up through real measurement from
999 tracks (GTZAN) to 7,996 clips (FMA-small), held top-1 identification accuracy at
95 to 99% under clean conditions and 72.5% even under heavy noise (SNR -5 dB). An
eightfold catalog expansion confirmed accuracy barely degrades, but the same
measurement exposed the real bottleneck: not the algorithm but the index structure.
A single in-memory dictionary growing at roughly 0.889 MB per track, extrapolated
linearly to a million-song catalog, requires roughly 868 GB of resident memory. No
single machine with that much RAM exists on any commercial cloud.

The sharded-index paper attacks this 868 GB problem head-on. The same hash table is
split into K shards by hash key, and whether sharding degrades accuracy was verified
against real GTZAN audio. Because the routing rule is a pure function of the hash key
itself, it is an exact, non-overlapping partition with no path for information to be
dropped or duplicated, and there is no channel through which accuracy could degrade.
Real measurement confirms this directly: scaling shard count 32x from 1 to 32 still
produced exactly the same 140 of 150 correct matches (93.3%). Memory is the more
interesting story. At a fixed catalog (998 tracks), a single shard's measured memory
fell from 1,001.7 MB at K=1 to 205.7 MB at K=32, but not as cleanly as the 1/K
reduction in raw hash posting count, because a fixed per-process overhead (interpreter,
numerical library loading, roughly 180 MB) sets a floor. Projecting a million-song
design using synthetic white-noise fill run through the real fingerprinting pipeline,
choosing a shard capacity of 6,000 tracks requires 167 shards, and one shard's
measured memory is 6.13 GB - comfortably within a commodity server.

```chart
{"kind":"bar","title":"Audio fingerprinting: catalog scale and noise robustness (GTZAN/FMA, real measurement)","labels":["Top-1 clean (GTZAN/FMA)","Top-1 at -5dB SNR","Sharding K=1 to 32 accuracy preservation","Single-shard RSS improvement (K1 to K32)"],"values":[97.0,72.5,93.3,79.5],"note":"Mixed units shown on one axis (accuracy %, preservation %, memory improvement %). Not a direct comparison across bars - the point is that all four measurements hold up under scale and noise. Memory improvement is the relative drop from 1,001.7MB to 205.7MB (K=1 to K=32, fixed catalog)."}
```

If broadcast and retail content licensing audit is the axis ready for a paid pilot today,
million-song-scale catalog indexing has a validated architecture, and the next step is
the transfer-gate work of finalizing shard capacity against real server budgets.

### 3.2 Sensing and Healthcare: Device-Free WiFi-CSI and the Collapse of a Common Belief

Sensing presence, falls, and activity from a single WiFi router's channel state
information (CSI) is attractive because it needs no dedicated sensor. On the public
dataset OPERAnet (CC0, real Intel 5300 CSI capture), presence detection AUROC
measured 1.000 and fall detection AUROC measured 0.99; on the UT-HAR benchmark
(seven activity classes) with 158-dimensional classical features and LightGBM,
classification accuracy measured 95.2%. Taken alone, these three numbers already
look deployment-ready.

But the question that comes up most often in the field is not "what is the accuracy"
but "how much does a model trained in this room degrade when moved to another
room." The cross-environment calibration paper confronts this directly and first
uncovered something unexpected. Trying to measure domain shift using the only group
variable UT-HAR provides - the official train/val/test boundary - produced a zero-shot
accuracy of 94.7-94.9%, almost identical to the in-split baseline (95.2%). This was not
evidence the benchmark is robust; it was this measurement re-confirming a leakage
the SenseFi paper itself disclosed, caused by sliding-window overlap. With no room,
subject, or date metadata in the public data, this boundary could not measure real
domain shift.

So a verifiable surrogate domain split was constructed directly, applying unsupervised
k-means clustering to per-channel average amplitude. Under this split, the story
changes completely. A classifier trained on the source domain and applied unchanged
to the target domain collapsed to 55.08% accuracy. Since the ceiling from training on
target-domain data alone is 92.37%, domain shift creates a 37.29-percentage-point
gap. Adding light calibration with 1, 5, 10, 20, and 50 target-domain labels per class to
the source training set raises accuracy in sequence to 57.16%, 64.55%, 70.62%,
78.23%, and 84.92%, recovering 5.6%, 25.4%, 41.7%, 62.1%, and 80.0% of the gap.
Adding just 50 labels per class - 350 total, only 9.7% of the source training set -
recovers 80% of the gap.

```chart
{"kind":"line","title":"WiFi-CSI cross-environment calibration: light target-domain labels and accuracy recovery (UT-HAR, real measurement)","labels":["Zero-shot (55.08%)","1/class","5/class","10/class","20/class","50/class (350 total)"],"series":[{"name":"Accuracy (%)","values":[55.08,57.16,64.55,70.62,78.23,84.92]}]}
```

The operational implication is clear. Deploying WiFi-CSI sensing across multiple
rooms or sites should not reuse a model trained at one site as-is; a calibration step
that opens the presence-detection gate with a small set of target-site labels should be
a standard part of the process. Presence and fall detection have cleared the
proof-of-concept gate, but multi-site deployment means the transfer gate must make
this calibration procedure a mandatory line item.

### 3.3 Security and Authentication: The Honest Operating Point of RF Fingerprinting

No two wireless devices of the same model behave identically. Manufacturing
tolerances in the analog transmit chain - oscillator phase noise, ADC/DAC
nonlinearity, power amplifier response curves - differ slightly device to device, and
this difference leaves a reproducible trace in the radiated waveform. RF fingerprinting
(RFFI) identifies devices from this trace, and its appeal - confirming identity from
physical-layer signal alone, with no credential provisioning - has made it a proposed
solution for everything from detecting unregistered devices on factory wireless
networks to industrial IoT authentication to medical device network access control.

But most of the impressive numbers around RFFI report classification accuracy - which
enrolled device, among a known candidate list, sent this signal. What access control
and authentication actually face is a different question: when a device not on the
enrolled list impersonates an enrolled identity, can that attempt be rejected at a low
false-alarm rate? High classification accuracy guarantees nothing about this question.
The reproducible open-set evaluation protocol paper quantifies exactly this gap: the
same model's AUROC swings from an optimistic 0.9994 (reinterpreting the task as
classification among enrolled candidates) to a strict 0.2235 (true open-set rejection of
unknown devices) - a more than fourfold difference in reported reliability depending
purely on evaluation methodology.

The open-set RF fingerprint verification paper measured the real operating point
under the strict protocol. Separability (AUROC 0.87) is real, but the authentication
rate collapses at the low false-alarm-rate points access control actually requires. At
K=1 (single packet), TAR is 20.8% at FAR=1% and falls to 2.9% at FAR=0.1%. The
same gap reproduced across two publicly available datasets under different licenses,
which indicates this is a property of the task itself rather than an artifact of one
dataset. Ten-packet pre-enrollment fusion (K=10) narrows this gap substantially,
raising TAR to 91.4% at FAR=1%, but at the strictest point (FAR=0.1%) it remains at
61.6%.

```chart
{"kind":"line","title":"RF fingerprinting: TAR collapses as FAR tightens, fusion (K) mitigates it (real measurement)","labels":["FAR=1%","FAR=0.1%"],"series":[{"name":"K=1 (single packet)","values":[0.208,0.029]},{"name":"K=10 (pre-enrollment fusion)","values":[0.914,0.616]}]}
```

Where this collapse comes from was measured separately. A probe-point ablation
study trained an independent fingerprint model at each of seven points in the
receive chain (P0 raw IQ through P7 demodulated symbols) and found the opposite of
the common intuition. From a communications-performance standpoint, a signal that
has passed through automatic gain control, carrier frequency offset correction, symbol
synchronization, and carrier phase recovery is always "cleaner," so the intuition is that
fingerprints should be extracted from that refined signal too. Measurement showed
the opposite. Equal error rate (EER, lower is better, chance level is 0.5) was lowest at
the very front of the chain: 0.307 at P0 (raw IQ), 0.306 at P1 (post-AGC), and steadily
worsened through CFO correction (P2, 0.330) and matched filtering (P3, 0.410),
approaching chance after symbol synchronization (P4, 0.489) and carrier phase
recovery (P5, 0.493), reaching 0.499 at the final demodulated-symbol stage (P7) - a
level statistically indistinguishable from chance under a verification framing. The
standard processing that improves communication quality erases device fingerprints
by almost exactly that much, giving a concrete transfer-gate directive: extract
fingerprint features close to raw IQ, not from refined symbols.

The same open-set principle repeats in drone detection. The real value of a
counter-drone system is not how accurately it identifies drones already in its library,
but how honestly it rejects drones it has never seen. On the public dataset DroneRF
(CC BY 4.0), at K=1 (single observation, no fusion) - the condition closest to real field
conditions - the classical DSP+GBM method's unknown-device rejection rate was 5.7x
(0.424 vs 0.074) that of deep learning. Even though the deep-learning embedding
already carried signal clearly above chance from a single packet, the classical method
led clearly at low-K open-set rejection. The two methods converge only once observations
accumulate into the dozens, at K=20 and above. Combining the conclusions of these
five papers, 2i honestly redefines RFFI not as a single hard-authentication gate but as
a continuous-valued risk-score layer fused with other signals.

### 3.4 Industrial: Predictive Maintenance and the Fixed-False-Alarm-Rate Contract

Vibration-based predictive maintenance measured AUROC 1.000 under clean conditions
and, under heavy noise (-5 dB), held 0.636 - 3.4x a simple baseline - on the public
standard bearing-fault dataset CWRU. This axis is real measurement and a deployable
pilot candidate today. The same paper's acoustic axis remains validated only on
procedurally synthesized data - 90.3 under clean synthetic conditions and 49.2 under
-5 dB synthetic conditions, less stable under low SNR than vibration - and 2i does not
hide that validation on the real industrial-noise public dataset MIMII remains the next
step.

```chart
{"kind":"bar","title":"Predictive maintenance: clean vs low-SNR performance, vibration (real) vs acoustic (synthetic)","labels":["Vibration clean (real)","Vibration -5dB (real)","Acoustic clean (synthetic)","Acoustic -5dB (synthetic)"],"values":[100.0,63.6,90.3,49.2],"note":"Left two bars are real CWRU vibration measurements; right two are procedurally synthesized acoustic data (MIMII real-world validation is the next step)."}
```

What industrial wireless monitoring actually sells is not detection rate but a
false-alarm budget. In industrial wireless settings like private 5G slices and O-RAN
base stations, whether a target false-alarm rate of 0.05 actually holds was measured
with a CA-CFAR (cell-averaging) detector, and the target rate did hold in real
measurement. But the win was not uniform. Under conditions where the reference
cells' noise estimate gets pulled up along with the test cell, overall detection rate
(Pd) collapsed, and an OS-CFAR (order-statistic) variant designed exactly for this
failure mode recovered its advantage under that condition. "Holds the target
false-alarm rate" and "detection rate achieved within that promise" are different
questions, and the transfer-gate directive is to select among the CFAR family based on
the real noise environment rather than committing to one variant. Combining these
two papers, predictive maintenance's vibration axis and industrial wireless monitoring's
fixed-false-alarm-rate contract are pilot-ready today, while the acoustic axis is honestly
placed in the expansion stage pending validation on real field-noise data.

### 3.5 Edge and AI Infrastructure: Cheap Hardware and Trustworthy Decisions

The moment a signal model is actually sold, three operational questions remain: does
it run on cheap edge hardware, does it fit inside the real-time processing budget, and
how much can that decision be trusted? The INT8 quantization paper answers the first.
Post-training quantization (calibration only) collapses accuracy by 31.27 percentage
points to 61.91%, but quantization-aware training (QAT) recovers 94.5% of that loss,
landing back near 91.5%, while model size drops 70.3% and inference latency drops
43.2%. Since the PTQ path enjoys the same size and latency gains while sacrificing
accuracy alone, the transfer-gate answer is clear: if edge deployment is the goal, do
not stop at PTQ - go to QAT.

```chart
{"kind":"bar","title":"INT8 quantization: PTQ vs QAT (real measurement)","labels":["FP32 baseline","INT8 PTQ","INT8 QAT"],"values":[93.18,61.91,91.5],"note":"PTQ drops accuracy by 31.27 percentage points; QAT recovers 94.5% of that loss. Model size (-70.3%) and inference latency (-43.2%) gains are shared by both PTQ and QAT."}
```

The budget attribution paper answers the second. Spec promises of "40 MSPS on a
single low-cost edge core" appear often, but are rarely checked against the real
nanosecond budget behind them. Repeated stage-by-stage measurement of a 12-stage
classical RF receiver front end found a canonical measured throughput of 7.59 MSPS
on a quiet machine - a real-time headroom ratio of just 0.19x against the 40 MSPS
target. Attributing the bottleneck stage by stage and applying optimization only raises
the headroom ratio to 0.33x. Closing the gap requires not optimization but multicore
distribution or hardware offload, and this paper nails that down with measured
numbers rather than spec marketing language.

The third question - can the decision be trusted - is answered by two papers together.
The tabular boosting versus deep learning paper re-confirms that in a small-sample
regime of just 539 training samples, LightGBM (accuracy 0.855) topped all nine models
compared, a 17.4-percentage-point lead over deep learning taking raw IQ input directly
(0.681). As training samples grow from 539 to 9,900, deep learning's accuracy climbs
steadily from 0.368 and the gap narrows, but as this document honestly states, a
crossover point has not yet been observed. The practical guidance is to reach for
physical features plus boosting first when data is scarce. The calibration paper
measures the trustworthiness of the decision itself. Most signal decision systems set a
hard threshold on a classifier score to decide pass or block, and how far that score
diverges from real probability, measured as expected calibration error (ECE), averaged
0.0446. Applying isotonic regression brings ECE down to 0.0188, with temperature and
Platt scaling improving to similar levels, and critically, this calibration does not
damage discriminative power (AUROC). Improving confidence reliability while
preserving discriminative performance intact maps directly onto RFFI's risk-score
layer design - a calibrated continuous-valued score is what makes a risk-score layer
that fuses multiple signals meaningful in the first place.

### 3.6 Finance: Backtest Discipline (Research and Methodology, Not Investment Advice)

The final axis, showing how far measurement discipline transplants beyond signal
processing, is quantitative backtesting. This section is purely a methodology and
reproducibility study and is not investment advice on any specific security or
strategy. Three bias mechanisms were isolated and measured through separate
controlled experiments on synthetic time series. Look-ahead bias, from misaligning a
single index, manufactures an illusion of performance up to 21x. Survivorship bias,
from dropping delisted or merged companies out of an index calculation, confirmed a
3.8-percentage-point annual CAGR difference arising purely from that omission. The
third, multiple testing, occurs even when the code is entirely correct. On a random
walk designed with true expected return set exactly to zero, trying moving-average
crossover strategy parameters from 5 to 2,000 combinations raised the best in-sample
Sharpe ratio from 0.34 to 0.90, while out-of-sample reproduction performance stayed in
a noise band between -0.07 and 0.17. A naive significance test that ignores the
number of attempts flagged false significance increasingly often as N grew, from 6.7%
to 46.7%, while Bonferroni correction and the deflated Sharpe ratio held a rejection
rate of 0% across all N, correctly reading the true, unbiased-by-design nature of the
data.

```chart
{"kind":"bar","title":"Backtest discipline: magnitude of illusion from three bias mechanisms (synthetic controlled experiments)","labels":["Look-ahead multiplier (x)","Survivorship bias (annual CAGR pp)","Multiple testing false significance naive test (pct)","Multiple testing false significance corrected (pct)"],"values":[21.0,3.8,46.7,0.0],"note":"Four metrics use different units (multiplier, percentage points, percent). Not a direct comparison - the point is that all three mechanisms are real measured biases under controlled experiments, and correction methods (Bonferroni, deflated Sharpe ratio) return the multiple-testing illusion to 0%."}
```

What these three experiments jointly prescribe is not a flashy new technique but a
tedious procedure: explicitly confirm whether the signal-calculation index and the
return-calculation index differ, use actual filing dates for financial data, use the real
universe as it existed at that point in time, and record the total number of parameter
combinations tried from the outset so final performance can be re-evaluated against
that count. This discipline is the same principle - pre-registration, shuffle-and-control,
leakage blocking - that recurs throughout this whitepaper's signal-processing sections,
transplanted into a different domain. 2i, a signal intelligence company, includes
backtest discipline in this whitepaper because what it sells is not a per-industry
algorithm but this principle itself.

## 4. Application Map: A Maturity Ladder

When extending the evidence secured across 16 papers into other industries, 2i
honestly separates it into a four-step maturity ladder. Validated means already
confirmed on public real-measurement data and ready for a pilot today. Extension
means a natural application that still needs revalidation on customer data. Research
means the method exists but has not yet been verified. Concept means an idea stage
that only points a direction, ahead of verification. Any result validated only on
synthetic data is classified, without exception, as research or concept - never
overstated as real measurement.

In media and broadcast, audio content fingerprinting and its sharded index are
validated. Music rights monitoring, in-store music license audits, and rebroadcast
verification are pilot-ready now; podcast and radio ad-insertion verification is an
extension applying the same time-aligned search structure to a different catalog.

In sensing, healthcare, and smart buildings, WiFi-CSI presence and fall detection is
validated; multi-site elder-care and independent-living safety monitoring including a
cross-environment calibration procedure is an extension; sleep and activity pattern
analysis, or presence-based HVAC savings, are research, applying the same CSI feature
pipeline to a different classification target.

In industrial and manufacturing, vibration-based predictive maintenance and
fixed-false-alarm-rate industrial wireless monitoring are validated. Acoustic-based
predictive maintenance is an extension pending MIMII real-world validation; conveyor
and forklift vibration anomaly detection in logistics warehouses is research, applying
the same feature design to a different equipment class.

In security, defense, and communications, RF fingerprint verification and its
risk-score redefinition, drone open-set rejection, and the probe-point directive are
validated. Industrial IoT unregistered-device detection is an extension applying the
same fingerprint pipeline to a different enrollment list; spectrum sharing and
interference-source localization enhancement is research; integrated defense and
public-safety sensing remains concept.

In edge and AI infrastructure, INT8 quantization, budget attribution, the tabular
boosting versus deep learning decision map, and calibration are all validated.
Multi-model deployment on a single low-cost on-premise gateway - running several
signal models at once - is an extension, repeatedly applying the same quantization
and budget-attribution procedures.

In finance, backtest discipline itself is validated as a methodology, but applying it to
any specific strategy is outside this document's scope and requires a separate
investment-advisory engagement. 2i keeps this boundary explicit.

## 5. Honest Boundaries: What Is Validated, What Is Boundary, What Is Research

What this whitepaper insists on most is not overstating maturity. Three boundaries are
made explicit. First, RF fingerprinting does not yet have sufficient basis to be sold as a
hard authentication gate for access control. Separability is real, but the operating
point at strict false-alarm rates does not meet real-world requirements, and 2i
proposes it only as a continuous-valued risk-score layer fused with other signals.
Second, the acoustic axis of predictive maintenance and some conditions of industrial
CFAR detection remain on synthetic data or partial real measurement, and validation
on the real industrial-noise dataset MIMII, plus reproduction across varied noise
environments, remains the next step. Third, whether a crossover point exists in the
tabular boosting versus deep learning data-scaling experiment has not yet been
confirmed, and this document does not claim otherwise.

Conversely, the axes with sufficient basis for deployment today are equally clear.
Audio fingerprinting and its sharded expansion, WiFi-CSI presence and fall detection
(including the light on-site calibration procedure), vibration-based predictive
maintenance, the QAT path of INT8 quantization, and calibration correction have all
confirmed performance clearly above chance on public real-measurement data, with
each result's conditions (dataset, noise level, fusion count) specified in Section 3.
Backtest discipline is independently valid as a methodology study, but any decision to
apply it to real capital allocation is outside the scope of this document.

## 6. Working with 2i

Every project with 2i begins at the measurement gate. Over a fixed-cost two-to-three
week window, we look at field data together and answer, with numbers, whether this is
a problem the signal can solve. Passing moves to the proof-of-concept gate, where a
cheap method and an expensive method are pitted against each other on real field
data. Only what passes moves to the transfer gate to become an operating system.
Each gate leaves a document behind: the measurement gate leaves a problem
definition and an estimated-effect projection; the proof-of-concept gate leaves a
conditional performance report in the same form as Section 3 of this whitepaper; the
transfer gate leaves a hardware-and-budget verification report and an operating
manual.

This process can combine with Korea's 2026 government AI transformation support
program. The program supports up to KRW 50 million per participating company
(KRW 10 million for expert consulting, KRW 40 million for PoC validation), which
substantially reduces the cost burden of the measurement and proof-of-concept gates.
2i works alongside applicants from application drafting through gate design, and
eligibility and application procedure can be confirmed in the first consultation.

## References

1. Audio Content Fingerprinting at Scale - [Korean](/papers/pdf/audio-content-fingerprinting-at-scale-ko.pdf) - [English](/papers/pdf/audio-content-fingerprinting-at-scale-en.pdf)
2. A Sharded Index for Million-Song Content ID - [Korean](/papers/pdf/sharded-index-million-song-content-id-ko.pdf) - [English](/papers/pdf/sharded-index-million-song-content-id-en.pdf)
3. Device-Free WiFi-CSI Sensing - [Korean](/papers/pdf/device-free-wifi-csi-sensing-ko.pdf) - [English](/papers/pdf/device-free-wifi-csi-sensing-en.pdf)
4. WiFi-CSI Cross-Environment Calibration - [Korean](/papers/pdf/wifi-csi-cross-environment-calibration-ko.pdf) - [English](/papers/pdf/wifi-csi-cross-environment-calibration-en.pdf)
5. Classical DSP+GBM vs Deep Learning: A Signal Task Decision Map - [Korean](/papers/pdf/classical-dsp-gbm-vs-deep-learning-signal-tasks-ko.pdf) - [English](/papers/pdf/classical-dsp-gbm-vs-deep-learning-signal-tasks-en.pdf)
6. Open-Set RF Fingerprint Verification - [Korean](/papers/pdf/openset-rf-fingerprint-verification-ko.pdf) - [English](/papers/pdf/openset-rf-fingerprint-verification-en.pdf)
7. A Reproducible Open-Set Evaluation Protocol - [Korean](/papers/pdf/reproducible-openset-evaluation-protocol-ko.pdf) - [English](/papers/pdf/reproducible-openset-evaluation-protocol-en.pdf)
8. Classical Feature-Based Predictive Maintenance: Vibration and Acoustic - [Korean](/papers/pdf/classical-predictive-maintenance-acoustic-vibration-ko.pdf) - [English](/papers/pdf/classical-predictive-maintenance-acoustic-vibration-en.pdf)
9. Probe-Point Fingerprint Ablation - [Korean](/papers/pdf/probe-point-fingerprint-ablation-ko.pdf) - [English](/papers/pdf/probe-point-fingerprint-ablation-en.pdf)
10. INT8 Quantization of Signal Models: QAT vs PTQ - [Korean](/papers/pdf/int8-quantization-signal-models-qat-vs-ptq-ko.pdf) - [English](/papers/pdf/int8-quantization-signal-models-qat-vs-ptq-en.pdf)
11. Edge Signal Processing Budget Attribution - [Korean](/papers/pdf/edge-signal-processing-budget-attribution-ko.pdf) - [English](/papers/pdf/edge-signal-processing-budget-attribution-en.pdf)
12. Fixed False-Alarm-Rate Industrial Detection - [Korean](/papers/pdf/fixed-false-alarm-rate-industrial-detection-ko.pdf) - [English](/papers/pdf/fixed-false-alarm-rate-industrial-detection-en.pdf)
13. Drone RF Detection: The Open-Set Reality - [Korean](/papers/pdf/drone-rf-detection-open-set-reality-ko.pdf) - [English](/papers/pdf/drone-rf-detection-open-set-reality-en.pdf)
14. Tabular Boosting vs Deep Learning: Signal Features - [Korean](/papers/pdf/tabular-boosting-vs-deep-learning-signal-features-ko.pdf) - [English](/papers/pdf/tabular-boosting-vs-deep-learning-signal-features-en.pdf)
15. Calibrated Confidence: A Signal Risk Score - [Korean](/papers/pdf/calibrated-confidence-signal-risk-score-ko.pdf) - [English](/papers/pdf/calibrated-confidence-signal-risk-score-en.pdf)
16. Backtest Discipline and Overfitting - [Korean](/papers/pdf/backtest-discipline-overfit-ko.pdf) - [English](/papers/pdf/backtest-discipline-overfit-en.pdf)
