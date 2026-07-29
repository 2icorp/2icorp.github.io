# Measurable Signal Intelligence: One Decision Logic, Many Industries

## Abstract

This whitepaper ties together five technical papers 2i has produced into a single
business thesis. Audio fingerprinting, WiFi channel-state-information (CSI) presence
and fall sensing, a measured decision map between classical signal processing and deep
learning, open-set RF fingerprint verification, and predictive maintenance appear on
the surface to belong to five different industries: media, healthcare, telecom,
security, and manufacturing. They do not. All five papers run the same underlying
mathematics. Physical signals (sound waves, radio-frequency waves, vibration) are
reduced to features, and those features are judged against a known, enrolled, or
normal state through anomaly detection, entity identification, and open-set
classification. The body is one; only the face changes with the industry. That
identity is what 2i sells. Not a scattered set of industry point solutions, but one
decision logic transplanted across industries.

The five tasks do not sit at the same maturity level, and this whitepaper does not
hide that unevenness. Audio content fingerprinting was measured on 999 tracks (GTZAN)
and 7,996 clips (FMA-small), reaching 95-99% top-1 identification accuracy under clean
conditions and holding 72.5% even under heavy additive noise (SNR -5dB) -- mature
enough to start a paid pilot today. WiFi-CSI presence/fall sensing and vibration-based
predictive maintenance are both verified on real public datasets, but a pilot that
re-measures on the client's own site data is the honest next step. At the far end sits
open-set RF fingerprint verification. Separability is real (AUROC 0.87), but at the
low false-accept-rate operating point that hard access control actually requires, the
true-accept rate collapses to 2-3%, which is not enough evidence to sell it as a
single-decision gate. This document keeps these three tiers -- what can be sold today,
what needs re-measurement, and what is still research -- distinct throughout.

That honesty is not a virtue signal; it is a method. 2i works through a gauge
methodology that splits every engagement into three gates -- Measure, Verify, and
Operate -- where each gate must earn the budget for the next, and a failing gate is
reported honestly as "AI is not the answer here, not yet." Section 3's five studies
are the evidence that this gauge methodology actually produces defensible numbers, and
Section 4's application map shows how the same decision logic extends into roughly
twenty use cases across manufacturing, healthcare, energy, logistics, telecom, and
media -- without inflating maturity anywhere along the way.

## 1. Why Signal Intelligence: One Decision Logic, Many Industry Faces

Companies selling AI transformation usually tell an industry-by-industry story:
vision inspection for manufacturing, demand forecasting for retail, content
recommendation for media. That framing is not wrong, but it misses something. A
large share of problems across industries that look different on the surface are
mathematically the same question underneath. "Is this sound the track we know?"
(audio fingerprinting). "Is someone in this room right now, and did they fall?"
(WiFi sensing). "Did this transmission come from the enrolled device it claims to
be, or from a device we have never seen?" (RF fingerprinting). "Has this bearing's
vibration drifted outside its normal range?" (predictive maintenance). All four
questions reduce to one form: extract features from a physical signal, and decide
whether the resulting distribution belongs to a known, enrolled, or normal state.

The thesis 2i argues in this whitepaper is simple. Once this decision logic is built
properly once, it does not need to be rebuilt when the industry changes -- only the
signal source and the feature design need to change. The time-aligned voting
structure verified in audio fingerprinting, built to search a long catalog with a
short query, becomes the skeleton of RF fingerprinting once the signal type shifts
from audio to radio-frequency electromagnetic waves. The approach verified in
WiFi-CSI sensing -- hand-designed physical features classified with gradient
boosting -- becomes predictive maintenance once the signal source shifts from
wireless channel state to vibration accelerometry. That is the body underneath
products that look, from the outside, like unrelated offerings.

There is a dangerous trap in this thesis, and this whitepaper names it directly.
"The decision logic is the same" does not mean "the performance is the same."
Section 3's classical-versus-deep-learning decision map shows that the same decision
logic wins with classical methods on tasks with little data and physically
interpretable features (modulation classification, interference detection), and
loses to deep learning on tasks that are data-rich and where the task itself is
representation learning (co-channel signal separation). Saying the decision logic
transfers across industries also means each face of it must be re-verified with real
data. This duality -- the structure transfers, but the performance must be re-measured
task by task -- is the method running through this entire document, which is why
Section 2 is devoted to how that re-measurement happens in stages, with risk
contained at every step.

## 2. The Gauge Methodology: Measure, Verify, Operate

The most common reason small and mid-sized manufacturers and retailers fail at AI
transformation is not a bad model. It is a missing order of operations. When a large
contract is signed before anyone has learned what actually works, the money is
already spent on things that do not work. 2i inverts that order. Every engagement is
split into three gates, each with a pass criterion, and failing a gate means the next
gate is not billed.

The first gate is Measure. Over two to three weeks, 2i interviews the site and looks
at the data. What is the real problem, does a decision logic on physical signals
exist that can solve it, and if so, what does solving it save -- answered in numbers.
If the conclusion is "AI is not the answer right now," that is reported honestly. The
gate runs at a fixed cost, so the initial commitment stays small.

The second gate is Verify. One candidate from the Measure phase is built and run for
real. Not a demo -- effect is measured against site data. The core methodological
discipline of this whitepaper operates here: a cheap method and an expensive method
are set side by side, and the expensive method is only adopted if it actually wins.
The result readers will see in Section 3 -- classical methods winning three tasks,
deep learning winning one, two still undetermined -- is exactly this discipline
applied across six signal tasks. Only what passes this gate earns the right to be
built.

The third gate is Operate. What Verify confirmed is turned into a system that runs in
production, and handed to the client's own team to run it themselves. The pass
criterion is not continued dependence on 2i, but a state that runs without 2i.

Underneath all three gates is a measurement discipline. A number produced with a
flawed method looks fine until the pilot, where the number collapses along with the
client's trust. 2i applies five safeguards to every experiment log. Pre-registration
(pass/fail criteria are written down before the experiment runs, and never moved
after seeing the result). Shuffle controls (labels are randomly permuted and the
experiment rerun; if performance survives the shuffle, it was statistical noise, not
signal). False-alarm-rate-matched comparison (two detectors' detection rates are only
compared once their false-alarm rates are matched -- anyone can raise detection rate
by lowering the threshold). Leakage prevention (decision thresholds are calibrated
only on normal/enrolled data; calibrating on the very targets meant to be caught --
unregistered devices, unknown signal sources -- uses information that will not exist
in the field). And disclosure of negative results (what did not work is reported as
not working, not quietly dropped). These five safeguards are not slogans; they are
the discipline actually applied in every one of the five papers summarized in
Section 3, visible in the confidence intervals and limitation paragraphs attached to
every measured number in Section 3 and 4.

2i applies these five safeguards during the Measure gate, and only what survives them
spends Verify-gate budget. The single biggest fear in AI adoption -- spending money
and finding out it did not work -- is removed not by better hardware or a better
model, but by this procedure. Cutting risk at every gate instead of starting from a
gut feeling is how 2i turns AI transformation into a process rather than a gamble.
Section 6 returns to what deliverables and quotes these three gates actually produce,
and how they combine with government AI-transformation vouchers.

## 3. Five Studies

This section summarizes five technical papers 2i has measured, each structured as
problem, method, headline result, and maturity. Every number is a real measurement;
wherever synthetic data was used, that is disclosed at the point it appears. Each
subsection links to the full Korean and English PDF of the source paper.

### 3.1 Large-Scale Audio Content Fingerprinting

Broadcasters, retail platforms, and in-store music services all face one question in
common: can the audio coming from this speaker or this broadcast channel be matched
to a specific track in a catalog within seconds? Without that ability, royalty
settlement, broadcast advertising verification, and in-store music license compliance
audits are all impossible. 2i reproduced and measured peak-pair constellation
hashing -- the algorithm family behind commercial audio-recognition services such as
Shazam -- on two public datasets.

First, on GTZAN (999 tracks), the goal was simply to verify that the algorithm works
at all. Under clean conditions, top-1 identification accuracy reached 95.0% (10-second
clips), holding at 72.5% even under strong additive noise (SNR -5dB), and staying at
96.7% across 32-128kbps MP3 compression with almost no degradation. The next question
was the real commercialization gate: does accuracy survive as the catalog grows? A
cumulative scaling experiment on FMA-small grew the catalog 16x, from 500 to 7,996
songs. Clean top-1 accuracy barely moved, from 99.5% to 99.0%, and stayed at 99.5%
under SNR 5dB, while a naive spectrogram-similarity baseline with no time alignment
collapsed to 17% under the same condition. Time-aligned voting -- not the hash itself
-- is the real engine of noise robustness.

The most important honest limitation lives in the index. The current index is a
single, unsharded, in-memory dictionary; extrapolating per-track memory use linearly
implies roughly 868GB of resident memory at a catalog of one million songs. The
algorithm does not die at scale, but the current index is pilot-demo grade, and real
commercial deployment needs a separate sharded external index layer. This is the
most commercially mature of the five tasks -- a paid pilot can start today on
licensing and API access alone.

Full paper: [Large-Scale Audio Content Fingerprinting](/papers/pdf/audio-content-fingerprinting-at-scale-en.pdf)
(English) - [Korean PDF](/papers/pdf/audio-content-fingerprinting-at-scale-ko.pdf)

### 3.2 Device-Free WiFi-CSI Presence and Fall Sensing

Falls are among the most common causes of injury in the elderly population, and how
quickly a fall is detected in a care facility or a single-occupant elderly household
substantially changes recovery outcomes. Cameras raise privacy concerns that make
them hard to install in bedrooms and bathrooms, and wearables can be forgotten or
knocked off at the moment of the fall. 2i verified, on two public real-world
datasets, whether presence, activity, and falls can be distinguished from the channel
state information (CSI) of an already-installed WiFi link alone -- no camera, no
wearable. With no deep learning, 158 hand-designed features (subcarrier variance,
Doppler spectrum, envelope statistics) were classified with gradient boosting
(LightGBM).

On the UT-HAR benchmark, seven-way activity classification reached 95.2% accuracy,
and fall detection reached AUROC 0.990 (91.1% recall at a fixed 0.976 precision).
Separately, on real Intel 5300 CSI captures from OPERAnet, motion energy in 10-second
windows separated by an order of magnitude between an empty room and walking or
sitting/standing activity (52x for walking versus empty, 13x for sitting/standing
versus empty). This single statistic alone yielded a presence-detection AUROC of
1.000. Both results are measured on real data.

The paper does not hide its limits. Both datasets come from a single room and a
single session, so moving to a new room requires recalibration. It is a repeatedly
reported fact in this field that CSI's statistical character is strongly shaped by
furniture layout, wall material, and transceiver placement, and zero-shot transfer of
a pretrained model to a new room performs at chance level. Fortunately, gradient
boosting needs far fewer labels than deep learning to absorb this recalibration,
making site-by-site retraining with a small calibration set practical. In addition,
the millimeter-scale chest motion from breathing needed to distinguish a still,
present person from an empty room has not yet been verified on public data, and the
fall events in UT-HAR are scripted falls by healthy adult volunteers, not the slow,
partial falls of the elderly population this use case actually targets. This is a
research demonstration of technical feasibility, not a clinically certified medical
device.

Full paper: [Device-Free WiFi-CSI Presence and Fall Sensing](/papers/pdf/device-free-wifi-csi-sensing-en.pdf)
(English) - [Korean PDF](/papers/pdf/device-free-wifi-csi-sensing-ko.pdf)

### 3.3 Classical DSP+GBM vs Deep Learning: A Decision Map for Signal Tasks

A widely held belief in the wireless signal processing community is that deep
learning eventually beats classical signal processing (DSP) and gradient boosting
(GBM) on every task. 2i narrowed that belief into a testable claim and measured it
head to head across six tasks -- modulation classification, fixed-false-alarm-rate
interference detection, drone RF open-set rejection, channel estimation, RF
fingerprint fusion, and co-channel signal separation -- using the same data, the same
splits, and the same metrics for both sides.

The result was not a single verdict; it depended on the task's structure. On the
standard public RadioML2016.10a 6dB subset, classical modulation classification
(28-dimensional physical features + LightGBM, accuracy 0.855) clearly beat deep
learning (a 1.39M-parameter transformer, 0.681). For interference detection under a
fixed false-alarm-rate requirement, classical CFAR (constant-false-alarm-rate)
methods held the target false-alarm rate structurally even as the noise floor
shifted, while an unconstrained binary deep-learning detector exploded to a
false-alarm rate of 1.0 under the same condition. On drone RF open-set rejection,
reproduced on the public DroneRF dataset (CC BY 4.0), classical features with
Mahalanobis rejection achieved 5.7x the unknown-device rejection rate of deep
learning at a single observation (K=1: 0.424 versus 0.074).

Deep learning clearly won other tasks. On separating two wireless signals overlapping
in the same channel, a learned separator (a Conv-TasNet variant) achieved SI-SDRi
+3.01dB, while classical independent component analysis (ICA) scored -14.25dB --
worse than the mixed signal itself. Deep-learning embeddings also beat their own
classical fusion baseline on RF fingerprint fusion (AUROC 0.9994 versus 0.945 at
K=50 fusion), though this win comes from a same-session, multi-packet fusion
condition that is a research setting, not a commercial product condition. Channel
estimation, run through an initial experiment with a known methodological flaw,
produced only ambiguous signal, and remains undetermined between classical and deep
learning.

```chart
{"kind":"bar","title":"Best measured performance by task: classical vs deep learning (0-1 scale metrics)","labels":["Modulation class.\n(accuracy)","Drone open-set K=1\n(unknown rejection rate)","RF fingerprint K=50\n(AUROC)"],"series":[{"name":"Classical (DSP+GBM)","values":[0.855,0.424,0.945]},{"name":"Deep learning","values":[0.681,0.074,0.9994]}]}
```

The point of this map is not a scoreboard of "classical wins N, deep learning wins
M." What decided the outcome was task structure. Classical methods won where training
data was small and physically interpretable features existed; deep learning won
where data was plentiful and the task itself was representation learning. This
decision map is the methodological backbone of the thesis in Section 1 -- one
decision logic wearing different faces across industries means each face's winning
method must be re-verified.

Full paper: [Classical DSP+GBM vs Deep Learning](/papers/pdf/classical-dsp-gbm-vs-deep-learning-signal-tasks-en.pdf)
(English) - [Korean PDF](/papers/pdf/classical-dsp-gbm-vs-deep-learning-signal-tasks-ko.pdf)

### 3.4 Open-Set RF Fingerprint Verification: Separability vs the Operating-Point Gap

RF fingerprinting identifies wireless devices by the microscopic traces that
manufacturing tolerances in the analog transmit chain -- oscillator phase noise,
ADC/DAC nonlinearity -- leave in the radiated waveform. Because it draws an identity
signal from the physical layer itself, with no cryptographic key required, it is
proposed for use cases such as unregistered-device detection on factory wireless
networks and industrial IoT authentication. The problem is that nearly all of these
proposals cite accuracy on a closed-set question -- which of the known devices sent
this -- when access control actually faces a different, open-set question: can an
unregistered device, attempting to impersonate an enrolled identity, be rejected at a
low false-accept rate?

2i measured this question across three public datasets (WiSig, INRIA PLA, WIDEFT).
Single-packet (K=1) AUROC ranged 0.70-0.87 across the three, clearly above chance
(0.5). Separability is real. But moving to hard authentication -- the low
false-accept-rate operating point (TAR@FAR) an access-control gate must actually
decide at -- causes this signal to collapse. On INRIA (CC BY 4.0, commercially
usable), true-accept rate (TAR) was 20.8% at FAR=1%, and only 2.9% at FAR=0.1%.

```chart
{"kind":"line","title":"RF fingerprinting: TAR collapses as FAR tightens, fusion (K) mitigates it (INRIA, measured)","labels":["FAR=1%","FAR=0.1%"],"series":[{"name":"K=1 (single packet)","values":[0.208,0.029]},{"name":"K=10 (pre-registered fusion)","values":[0.914,0.616]}]}
```

Fusing ten pre-registered packets (K=10) substantially narrows this gap. At FAR=1%,
TAR climbs to 91.4%, close to an access-control threshold, but tightening FAR to
0.1% drops TAR back down to 61.6%. Even after accumulating ten packets, the gap at
the strictest operating point does not fully close. The fact that this same gap
reproduces across two datasets with different licenses (WiSig is non-commercial
only, INRIA is commercially usable) suggests this is a property of the task itself,
not an artifact of one dataset.

The conclusion is that with today's public data and public methods, there is not
enough evidence to stand up RF fingerprinting as a single-decision hard access
gate. What 2i can honestly sell is not a single-decision gate but a continuous-valued
risk-score layer that gets fused with other signals. The consumer of that confidence
score should be a fusion platform, not the end user directly, and a low-confidence
attempt should route to additional verification (secondary authentication, an
administrator alert) rather than an immediate block -- a defense-in-depth design
matched to the current evidence level.

Full paper: [Open-Set RF Fingerprint Verification](/papers/pdf/openset-rf-fingerprint-verification-en.pdf)
(English) - [Korean PDF](/papers/pdf/openset-rf-fingerprint-verification-ko.pdf)

### 3.5 Classical-Feature Predictive Maintenance: Vibration and Acoustic

Predictive maintenance -- catching rotating-equipment faults (bearings, pumps,
motors) early -- was measured with classical signal-processing features and gradient
boosting rather than deep learning. Envelope spectrum, cepstrum, and wavelet
band-energy features -- all physically grounded -- were extracted and classified
with LightGBM, and compared against a baseline using only simple time-domain
statistics.

Vibration signals were real 12kHz accelerometer measurements from the public
standard bearing-fault dataset CWRU (Case Western Reserve University Bearing Data
Center). On clean data, the full feature set and the simple baseline barely differed
(AUROC 1.000 versus 0.998) -- a large fault is easy for anyone to catch. The real
test was noise. Lowering signal-to-noise ratio to -5dB, the full feature set held at
0.636 while the simple baseline collapsed to 0.186 -- physically grounded features
degrade far more gracefully under noise. Separately, the same fixed-false-alarm-rate
CA-CFAR detector used in industrial wireless interference detection was verified on
this domain, holding a target false-alarm rate of 5% to a measured 5.29% while
achieving a 98.0% detection rate.

Acoustic signals are the one place in this whitepaper where synthetic, not measured,
data was used, because real factory microphone recordings have not yet been
obtained. Fault orders were computed from a standard nine-ball deep-groove bearing
geometry and generated procedurally; no CWRU data or recordings were used. The same
pattern reproduced on this synthetic data: accuracy fell from 90.3% clean to 49.2%
at -5dB for the full feature set, while the simple baseline started low and barely
moved (31.2% to 30.2%). But the fact that the pattern reproduced does not make the
acoustic numbers real measurements.

```chart
{"kind":"bar","title":"Performance under low SNR, vibration (real) vs acoustic (synthetic)","labels":["Vibration clean\n(real)","Vibration -5dB\n(real)","Acoustic clean\n(synthetic)","Acoustic -5dB\n(synthetic)"],"values":[100.0,63.6,90.3,49.2],"note":"Left two bars: real CWRU vibration data. Right two bars: procedurally synthesized acoustic data (real-recording verification against MIMII is the next step)."}
```

2i does not hide this distinction. Vibration is measured and is a deployable pilot
candidate. Acoustic is synthetic, and verification on the real industrial acoustic
public dataset MIMII is the next step. Sharing a methodology is a different claim
from having completed verification, and this paper does not conflate the two.

Full paper: [Classical-Feature Predictive Maintenance](/papers/pdf/classical-predictive-maintenance-acoustic-vibration-en.pdf)
(English) - [Korean PDF](/papers/pdf/classical-predictive-maintenance-acoustic-vibration-ko.pdf)

### Synthesis Across the Five Tasks

```chart
{"kind":"bar","title":"Headline measured metric across five tasks (clean/best-case condition, mixed metric types)","labels":["Audio top-1\n(GTZAN clean)","WiFi-CSI 7-activity\naccuracy","WiFi-CSI fall\nAUROCx100","Vibration PdM\nAUROCx100 (clean)","RF fingerprint K=1\nAUROCx100 (INRIA)"],"values":[95.0,95.2,99.0,100.0,86.8],"note":"Accuracy and AUROC are plotted on the same axis. This is not an apples-to-apples ranking; the only claim it supports is that all five tasks clear chance level under clean/best-case conditions. The gap under harsh conditions is covered task-by-task in Section 3 and again in Section 5."}
```

What this figure does not say matters. Five bars of similar height do not mean five
tasks of equal commercial maturity. Audio fingerprinting holds 72.5% even under harsh
conditions and can be sold today; RF fingerprinting shows the same 86.8%
separability collapsing to 2.9% at the hard authentication operating point. The real
measure of maturity is not the height of the clean bar but how well that height holds
under harsh conditions and hard operating points -- the boundary Section 5 returns
to.

## 4. The Application Map: One Engine, Many Industries

The decision logic in Section 3 -- extracting features from a physical signal and
judging deviation from a known, enrolled, or normal state -- does not stop at telecom
and media. Below is an application map drawn from technology 2i has actually
measured or holds. The tags are not inflated. **Demonstrated** means already built
and measured. **Extension** means it assembles naturally from technology already
held, but needs re-verification on the client's own data. **Research** means the
method exists but verification is not yet complete. **Concept** means it is an idea
stage where experiments have not yet started.

The top six priorities first: audio content ID (media/broadcast, **Demonstrated**),
rotating-equipment predictive maintenance (manufacturing, **Demonstrated**),
presence detection for energy optimization (smart buildings, **Extension**),
unregistered-device detection on OT networks (manufacturing, **Extension**), drone RF
detection/identification (security/defense, **Research**), and early partial-discharge
warning in substations (energy, **Concept**). The first two can start a paid pilot
today; the middle two start from a client-data pilot; the last two are honestly still
research and idea stage.

**Manufacturing.** Detecting a factory wireless interference source has already been
demonstrated (catching the fact that an interferer exists); pinpointing its exact
location is the next Extension task. Rotating-equipment predictive maintenance
(acoustic/vibration) transplants Section 3.5's demonstration directly, catching early
bearing/pump anomalies through noise and vibration. Detecting unregistered devices on
OT networks -- finding devices quietly plugged onto a production line via RF
fingerprint -- is an Extension.

**Healthcare.** Detecting interference and anomalies in hospital wireless networks
(patient monitors, IoMT) without interrupting the ward is an Extension. Contactless
presence/fall monitoring (patient rooms, elder care) directly transplants Section
3.2's UT-HAR/OPERAnet demonstration and is an Extension, with on-site hospital
validation as the next step. Contactless vital-sign (respiration/heartbeat) radar
sensing is Research, and requires clinical validation and medical-device
certification as separate gates.

**Smart Buildings and Homes.** Contactless presence detection for HVAC and lighting
energy optimization is already a commercial technology family deployed at tens of
millions of households abroad, and 2i reproduced the same principle on public data
(UT-HAR) at AUROC 0.99 (Extension). Fall detection for elderly single-occupant
households rests on the same Extension-level evidence. Sweeping for unauthorized
wireless devices hidden in meeting rooms is Research.

**Energy and Utilities.** Early partial-discharge warning for substations and
transformers is a detection principle that has been an industry standard for
decades, but transplanting 2i's fixed-false-alarm-rate detector onto this signal has
not yet started, hence Concept. Detecting anomalies and tampering on smart-grid
metering networks is Research.

**Logistics and Cold Chain.** RF/BLE tag authenticity verification (GPS tells you a
location, not whether the tag itself is genuine) and detecting unregistered beacons
in warehouses and yards are both Concept-stage, ideas to be verified together.

**Security and Defense.** Unknown signal-source identification and spectrum
situational awareness is an Extension that broadens the open-set identification
engine into a general spectrum-surveillance capability. Unauthorized drone
detection/identification rests on the K=1 measurement from Section 3.3 (unknown
rejection rate 0.424), but the absolute number is still low, so it is marked
Research -- while noting that a commercial anti-drone market already exists.
Sweeping facilities for illicit transmitters is also Research.

**Telecom and Spectrum.** An interference-detection SDK for SDR/RF vendors (including
O-RAN and private-5G slice isolation) has been measured on synthetic data at a 98.0%
detection rate and 5.3% false-alarm rate, and is Demonstrated. CBRS-style spectrum
co-existence monitoring is an Extension.

**Media and Broadcast.** Audio content ID and broadcast copyright monitoring is
Demonstrated, backed directly by Section 3.1's measurements, and is the item in this
map where a paid pilot can start soonest.

**Agriculture.** Early acoustic detection of respiratory illness in swine barns is a
cross-domain bet at some distance from 2i's core RF/signal stack -- only the method
transfers, and it is Concept-stage.

**Retail.** In-store WiFi-CSI foot-traffic and congestion analysis (camera-free)
applies Section 3.2's presence-decision logic and is Concept-stage.

What this map shows is not roughly twenty different products but one extension
surface: the decision logic verified across five papers, transplanted across signal
sources (audio, WiFi, RF, vibration, acoustic) and domain-specific feature design.
The distribution of tags -- roughly four Demonstrated, eight Extension, six Research,
five Concept -- is itself a statement of where 2i stands today. The core engine is
real and verified; most industry transplants still sit in Extension, Research, or
Concept.

## 5. Honest Boundaries: What Is Demonstrated, What Is at the Edge, What Is Research

The whole of this whitepaper compresses into one sentence: the decision logic is
singular, but the weight of evidence differs by task, and 2i does not hide that
weight.

**Demonstrated.** Audio content fingerprinting held 95-99% under clean conditions and
72.5% under harsh conditions (SNR -5dB) across measured data from 999 and 7,996
tracks. WiFi-CSI presence/fall sensing measured 95.2% seven-activity accuracy on
4,973 UT-HAR windows and AUROC 1.000 for presence detection on real Intel 5300 CSI
captures from OPERAnet. Vibration-based predictive maintenance held AUROC 1.000 clean
and 0.636 at -5dB (3.4x the baseline) on CWRU's real accelerometer data. These three
axes are the measured foundation on which a paid pilot, or a client-data
re-verification PoC, can start today.

**At the edge.** Open-set RF fingerprint verification confirmed real separability
(AUROC 0.87) but collapses at the low-false-accept-rate operating point hard
authentication requires (TAR at FAR=0.1% is 2.9%). This is not a failure to be
hidden; it is an edge that forces an honest redesign of the product form. 2i crosses
this edge with a different product shape -- a risk-score layer instead of a
single-decision gate -- and several of Section 4's Extension and Research items,
such as OT-network unregistered-device detection and internal illicit-transmitter
sweeps, stand on this same edge.

**Research and concept stage.** The acoustic axis of predictive maintenance has only
been verified on procedurally synthesized data, with reproduction on a real
industrial acoustic dataset (MIMII) as the next step. Channel estimation remains
undetermined between classical and deep learning. Partial-discharge early warning,
acoustic swine-illness detection, and contactless vital-sign radar sensing are cases
where the detection principle itself is an industry standard or verified in another
field, but transplanting 2i's decision logic onto that specific signal has not yet
started, or has only just begun.

These three tiers sit side by side so 2i does not claim to sell a finished, certified
product across the board. A company that says plainly "only audio content ID is
sellable today" is, over the long run, a more trustworthy partner than one that
inflates the other four into "almost there." That is exactly why a free diagnostic
consultation exists -- to establish, before any contract, whether a client's problem
sits in the Demonstrated tier, at the edge, or still needs research.

## 6. Working With 2i

The three gates introduced in Section 2 are not an abstract methodology; each one
leaves a concrete deliverable. Finishing the Measure gate hands the client a problem
statement, a shortlist of candidate applications (in the format of Section 4's map),
and a diagnostic report with expected effect and cost for each candidate. Finishing
the Verify gate hands over a performance table measured on the client's own site data
(in Section 3's format -- a cheap method and an expensive method side by side) and an
explicit recommendation on whether to scale. Finishing the Operate gate hands over an
operating manual, alongside a system the client's own team can run without 2i.

This sequence fits structurally with South Korea's 2026 government AI-transformation
support program, which funds up to KRW 50 million per demand company: KRW 10 million
for expert consulting (diagnosis and design), and KRW 40 million for PoC verification
(the Verify stage). The Measure gate's output becomes the basis of the grant
application itself, and the Verify gate becomes the PoC track record the voucher
requires. As the supplying (hub) company, 2i handles the application paperwork end to
end, and designs the technical plan and the funding application together so that a
substantial share of transformation cost can be covered by the support program.
Support amounts and eligibility follow each year's official announcement.

Measure, verify, operate. Cutting risk at gates instead of starting from a guess, and
attaching a real measured number and an honest limitation to every gate along the
way -- that is what this whitepaper's five studies were meant to demonstrate about
how 2i sells AI transformation. A free diagnostic consultation is where it starts.

## References

1. 2i. Large-Scale Audio Content Fingerprinting: Robust Song Identification Under
   Noise, Compression, and Tempo Shift, and the Honest Limits of Catalog Scaling.
   2026. GTZAN (999 tracks), FMA-small (8,000 clips, Creative Commons).
2. 2i. Device-Free WiFi-CSI Presence and Fall Sensing: A Real-Data Verification.
   2026. UT-HAR/SenseFi benchmark (Yousefi et al. 2017; Yang et al. 2023), OPERAnet
   (Bocus et al. 2022, CC0).
3. 2i. Classical DSP + GBM vs Deep Learning: A Measured Decision Map for Signal
   Tasks. 2026. RadioML2016.10a, DroneRF (CC BY 4.0).
4. 2i. Open-Set RF Fingerprint Verification: Separability vs the Operating-Point
   Gap. 2026. WiSig (CC BY-NC-SA 4.0), INRIA PLA (Zenodo 18268648, CC BY 4.0),
   WIDEFT (Zenodo 4116383, CC BY 4.0).
5. 2i. Classical-Feature Predictive Maintenance: Vibration and Acoustic. 2026. CWRU
   Bearing Data Center (real vibration), procedurally synthesized acoustic data
   (MIMII verification planned).
6. Wang, A. (2003). An Industrial Strength Audio Search Algorithm. ISMIR 2003.
7. Yousefi, S., Narui, H., Dayal, S., Ermon, S., & Valaee, S. (2017). A Survey on
   Behavior Recognition Using WiFi Channel State Information. IEEE Communications
   Magazine.
8. Bocus, M. J., Li, W., Vishwakarma, S., et al. (2022). OPERAnet: A Multimodal
   Activity Recognition Dataset Acquired from Radio Frequency and Vision-Based
   Sensors. Scientific Data.
