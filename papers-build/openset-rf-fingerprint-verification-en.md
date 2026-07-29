# Open-Set RF Fingerprint Verification: Separability vs the Operating-Point Gap

**2i** · 2026-07-29

## Abstract

RF fingerprinting identifies wireless devices by the microscopic hardware
imperfections that manufacturing tolerance leaves on the analog transmit
chain, even across units of the same model. Framed as an open-set
verification problem, distinguishing an enrolled genuine device from an
impostor that never appeared in training or calibration, separability is
real. Across three public datasets (WiSig, INRIA PLA, WIDEFT) we measured
single-packet (K=1) AUROC in the 0.70-0.87 range, clearly above chance
(0.5). But once the question shifts to hard authentication, the true
accept rate at the low false-accept operating point an access-control gate
must actually enforce, that signal collapses. On INRIA (CC BY 4.0,
commercially usable) TAR at FAR=0.1% was only 2.9%; on WiSig's
cross-receiver split it fell to 0.5%. The fact that the same gap
reproduces across two datasets under different licenses (WiSig is
non-commercial CC BY-NC-SA, INRIA is CC BY) suggests this is a property of
the task, not an artifact of one dataset. Ten-packet fusion (K=10)
narrows the gap substantially but does not close it (TAR is still 61.6%
at FAR=0.1%), and self-supervised pretraining raised AUROC modestly under
low-label conditions while, in our measurement, the strictest operating
point's TAR moved in the opposite direction. The honest conclusion is
that today's public data and public methods do not support standing RF
fingerprinting up as a hard access-control gate. What can be sold with
integrity is not a pass/fail gate but a continuous risk score fused with
other signals.

## 1. Background

Wireless devices built to the same design and the same bill of materials
do not behave identically. Manufacturing tolerance in the analog front
end, oscillator phase noise, ADC/DAC nonlinearity, IQ imbalance, power
amplifier response curves, differs slightly from unit to unit, and that
difference leaves a reproducible trace on the transmitted waveform. RF
fingerprinting (often shortened to RFFI) extracts that trace as a feature
and asks which physical device sent this signal.

The appeal is obvious. No extra credential or certificate has to be
provisioned; the identity signal comes straight from the physical layer.
Credentials can be stolen or cloned; the intuition is that hardware
manufacturing tolerance is much harder to replicate. That intuition drives
proposals ranging from detecting unregistered devices on a factory
wireless network, to authenticating industrial IoT gateways, to gating
access on medical-device networks. The problem is that nearly all of
these proposals are backed by closed-set classification accuracy, how
accurately the system can tell which known transmitter, among a fixed
list, sent a given signal. Access control asks a different question: when
a device that never appears on the enrolled list tries to impersonate an
enrolled identity, can the system reject that attempt at a low false-accept
rate? High closed-set accuracy guarantees nothing about that question.
This paper measures that gap directly and honestly.

We reopen this question because many headline numbers in the literature
are the product of post-hoc selection: fusing many packets, sweeping
several scoring methods, and picking the best combination after seeing
the results. An AUROC of 0.999 obtained that way measures something
different from the deployment condition that actually matters, a single
decision made the instant one packet arrives, against a threshold fixed
in advance. This paper strips that selection out and reports only what
survives under a pre-registered single-packet (K=1) condition and a
pre-registered multi-packet (K=10) condition.

## 2. Evaluation Methodology

Open-set verification has two stages. A subset of known devices is used
for enrollment, training, and threshold calibration; the remaining
devices are held out entirely as unknown. At test time, the system must
correctly reject signals from unknown devices while correctly accepting
signals from enrolled devices it has legitimately seen. The critical
discipline is that unknown-device data must never touch calibration or
training. Any leakage inflates performance optimistically. Every
experiment in this study calibrated thresholds only on a held-out
validation split of enrolled devices, exposing unknown-device data solely
at test time.

Three metrics matter here. Equal Error Rate (EER) is the single number
where the false-accept and false-reject rates coincide, a compact summary
of overall separability. AUROC integrates discriminative power across all
possible thresholds, describing separability before any threshold has
been chosen. Neither metric directly answers what an access-control
deployment needs to know. A real deployment fixes one false-accept-rate
target (FAR) and asks what fraction of genuine devices are accepted at
that operating point (TAR, true accept rate). AUROC can be high while
TAR@FAR is low, and that gap is this paper's central finding. We report
AUROC and EER alongside TAR at FAR=10%, 1%, and 0.1% throughout. FAR=0.1%
sits close to what a hard access-control gate typically demands, and the
TAR at that point is effectively "what fraction of legitimate users get
locked out if this system is turned into a gate."

Point estimates from small device counts (8 to 24 known devices) carry
real sampling variability. We report device-level bootstrap confidence
intervals to make that explicit. The INRIA K=1 AUROC point estimate of
0.868, for example, carries a 95% CI of [0.810, 0.932], wide because the
underlying sample is only 8 physical devices, not a computation error.
This paper's negative conclusion holds even at the optimistic end of that
interval.

The number of fused packets (K) is also a methodological choice with
real consequences. K=1 corresponds to the actual access-control scenario
where a single packet arrives and a decision cannot wait: no latency
budget for accumulation. Raising K to 10 or 50 averages scores across
multiple packets and substantially improves separability, but it costs
time to accumulate those packets and makes the decision boundary more
predictable to an adversary. We report K=1 as the primary result and a
pre-registered K=10 as supplementary context. Post-hoc, best-of-many K=50
numbers reported elsewhere in the literature are cited only as external
context, never as this paper's own finding.

This post-hoc-selection concern is not abstract. A separate leakage audit
of a related public result found that its headline K=50 fusion number had
been the best of 18 combinations (six K values times three scorers)
selected after seeing performance on the held-out split, not a
combination declared in advance and then measured once. A number obtained
that way is unlikely to reproduce in deployment, where results cannot be
seen before a scoring method is chosen. That is why this paper's headline
results are limited to K=1 and a single pre-registered K=10.

## 3. Data and Setup

This study uses three public datasets. We deliberately did not narrow to
one, so we could check directly whether the same result reproduces across
datasets under different licenses and capture conditions.

| Dataset | License | Device population | Capture conditions |
|---|---|---|---|
| WiSig (Hanna, Karunaratne, Cabric, 2022) | CC BY-NC-SA 4.0 (non-commercial) | 20 known devices, real over-the-air capture | Multiple receivers, multiple days, cross-receiver split |
| INRIA PLA (Zenodo record 18268648) | CC BY 4.0 (commercially usable) | 8 known + 4 held-out devices, 12 COTS IoT transmitters | Single BladeRF receiver, single session, 2.4 GHz ISM |
| WIDEFT (Zenodo record 4116383) | CC BY 4.0 (commercially usable) | 24 known consumer device models + 14 held-out | Single USRP B210 receiver, real WiFi capture |

WiSig is the most widely used benchmark in this field, but its
CC BY-NC-SA license restricts it to non-commercial research validation.
Any commercially defensible conclusion requires re-running the same
protocol on data that permits commercial use. We therefore independently
reproduced the same open-set verification protocol on INRIA PLA (CC BY
4.0). This re-measurement was not merely a license workaround; it was a
direct test of whether the gap was a quirk of WiSig's specific noise
profile or device population. As the results below show, the gap did not
close: INRIA actually posted a higher K=1 AUROC than WiSig (0.868 vs.
0.729), yet TAR@FAR=0.1% remained under 3%.

WIDEFT is a WiFi RF fingerprint dataset of consumer electronics, phones,
laptops, routers, streaming boxes. It is a reasonable proxy for the task
of enrolling authorized devices and rejecting unregistered ones on a
shared PHY-layer population, but it proves nothing about the actual RF
emission characteristics of medical devices or about regulatory
compliance. Here we deliberately used a different method family: 28
classical DSP features (IQ imbalance, CFO, instantaneous
frequency/phase/amplitude statistics, higher-order cumulants, spectral
bands) with a LightGBM/Mahalanobis classifier rather than a learned
embedding, to check whether the same failure pattern appears even without
deep learning.

The learned pipeline's backbone is an ECAPA-TDNN, an architecture widely
used for speaker verification, adapted to raw IQ, trained with an
ArcFace-style angular-margin loss combined with momentum contrastive
learning (MoCo). At verification time, distance between the query
embedding and an enrolled gallery of embeddings served as the score for
computing AUROC, EER, and TAR@FAR. Separately, we tested whether
self-supervised pretraining helps under low-label conditions: pretraining
on masked-IQ-span reconstruction, then fine-tuning on the same
verification task, compared against random initialization across three
seeds.

## 4. Results

The table below reports measured results under the pre-registered
conditions. All thresholds were calibrated only on the enrolled-device
validation split; unknown-device data was exposed only at test time.

| Condition | K | AUROC | EER | TAR@FAR=10% | TAR@FAR=1% | TAR@FAR=0.1% |
|---|---|---|---|---|---|---|
| WiSig, cross-receiver, random init (3-seed mean) | 1 | 0.729 | 0.334 | - | 12.1% | 4.2% |
| WiSig, cross-receiver, masked-IQ SSL pretrain (3-seed mean) | 1 | 0.752 | 0.314 | - | 10.9% | 2.6% |
| WiSig, cross-receiver, random init, pre-registered fusion | 10 | 0.953 | 0.116 | - | 33.9%\* | 14.5%\* |
| INRIA PLA, same receiver, same session | 1 | 0.868 | 0.215 | 63.0% | 20.8% | 2.9% |
| INRIA PLA, same receiver, same session, pre-registered fusion | 10 | 0.997 | 0.024 | 99.95% | 91.4% | 61.6% |
| WiSig, cross-receiver, separate domain-adaptation run | 1 | 0.695 | 0.344 | - | - | 0.5% |
| WIDEFT consumer-device proxy, classical DSP + distance-based | 1 | 0.519 | 0.480 | - | 0.7% | 0.1% |

\* WiSig K=10 row uses one representative seed; unlike INRIA we did not
run a separate 3-seed aggregate for the pre-registered K=10 fusion arm.

Three patterns stand out. First, K=1 AUROC ranges from 0.52 (WIDEFT,
near chance) to 0.87 (INRIA) across three datasets and two method
families (learned embeddings and classical DSP), yet TAR@FAR=0.1% never
exceeded 5% in any condition. Even INRIA, the highest-AUROC condition
measured, posted a TAR of 2.9% at that point. High AUROC and usable
access control are separate claims.

```chart
{"kind":"bar","title":"Separability vs the operating-point gap (K=1, measured)","labels":["WiSig(CC BY-NC-SA)","INRIA PLA(CC BY 4.0)"],"series":[{"name":"AUROC","values":[0.729,0.868]},{"name":"TAR@FAR=0.1%","values":[0.042,0.029]}],"note":"Measured values. High AUROC does not imply a usable authentication operating point."}
```

Second, multi-packet fusion (K=10) narrows this gap substantially but
does not close it. On INRIA, K=10 pushes TAR to 91.4% at FAR=1%, close
to an access-control threshold, but tightening FAR to 0.1% drops TAR
back to 61.6%. Even after accumulating ten packets, the strictest
false-accept target still locks out more than one in three legitimate
users. The nonlinearity of this collapse as FAR tightens is stark.

```chart
{"kind":"line","title":"TAR collapses as FAR tightens (measured)","labels":["FAR=1%","FAR=0.1%"],"series":[{"name":"INRIA K=1","values":[0.208,0.029]},{"name":"INRIA K=10 (pre-registered fusion)","values":[0.914,0.616]},{"name":"WiSig K=1 (random init)","values":[0.121,0.042]}]}
```

Third, self-supervised pretraining's effect diverged by metric. Masked-IQ
reconstruction pretraining raised K=1 AUROC from 0.729 to 0.752, a gain
of +0.0235 (3-seed mean, consistent in direction across all three seeds).
But under the same condition TAR@FAR=1% fell from 12.1% to 10.9%, and
TAR@FAR=0.1% fell from 4.2% to 2.6%. All three seeds moved in the same
direction (SSL lower) at both FAR points, which argues against this being
random noise. Because AUROC integrates discriminative power across the
entire threshold range, an improvement in the relaxed-threshold region can
mask a degradation in the strict-threshold region. This result
independently reconfirms, through a concrete intervention, this paper's
central caution against equating a rising AUROC with improved
authentication performance.

```chart
{"kind":"bar","title":"SSL pretraining: AUROC rises while TAR at the strict operating point falls (WiSig K=1, 3-seed mean)","labels":["Random init","Masked-IQ SSL pretrain"],"series":[{"name":"AUROC","values":[0.729,0.752]},{"name":"TAR@FAR=0.1%","values":[0.042,0.026]}],"note":"AUROC rose (+0.0235) while TAR@FAR=0.1% fell (-0.016) in the same measurement."}
```

Fourth, two standard mitigations we tried also failed to close the gap.
Gradient-reversal-layer (GRL) domain adaptation performed slightly worse
turned on than off (0.727 vs. 0.737 AUROC), and source-free contrastive
adaptation lowered K=1 AUROC by 0.030. This suggests the gap is not a
minor loss-function or scoring artifact but a bottleneck in the feature
space itself.

## 5. Implications

The most direct implication is unambiguous. Today's public data and
public methods, learned metric embeddings, classical DSP with
distance-based classifiers, self-supervised pretraining, domain
adaptation, do not support standing up a single-decision hard
authentication gate (K=1, FAR target at or below 1%). This conclusion is
not tied to one dataset or one backbone. The same failure pattern
reproduced across a non-commercially-licensed dataset (WiSig) and a
commercially usable one (INRIA), across same-receiver and cross-receiver
conditions, and across a learned pipeline and a classical DSP pipeline.

Multi-packet fusion is a useful mitigation, not a solution. Pre-registered
K=10 fusion approaches a practical threshold at a relaxed false-accept
target (FAR=1%), but it requires accumulating packets over time, which is
incompatible with instant-decision scenarios, and it still falls short at
the strictest target (FAR=0.1%). The near-1.0 AUROC numbers sometimes
cited in the literature for K=50, best-of-many-scorers combinations are
not what this paper reproduced; they are reported to have been selected
after seeing results without pre-registration, and should be treated as
measuring a different, less deployable condition.

The honest product form implied by this evidence is not a hard gate but
a risk-score layer. RF fingerprint verification should output a
continuous confidence value, fed into a fusion platform alongside other
signals, network-layer identity, behavioral baselines, geofencing, where
the final decision tolerates a moderate false-accept rate because another
signal or a human adjudicates borderline cases. That is a less dramatic
claim than a pass/fail gate, but it is the only form this measured
evidence honestly supports today.

We also state the conditions under which this conclusion could change. A
narrower, more homogeneous enrolled population (same vendor, same
procurement batch) might reduce cross-vendor heterogeneity and improve
separability. Re-measurement on a different PHY and environment, such as
an actual IoMT capture, could produce different numbers. What we measured
is what today's public data and public methods show; we do not claim this
permanently forecloses every RF fingerprinting application. We do claim
that any proposal to sell hard authentication today should be required to
present evidence at the level of rigor shown here.

Building a risk-score product on this evidence implies several concrete
design decisions. First, the consumer of the confidence value should be a
fusion platform, not the end user directly; gating access on the RF score
alone exposes the exact false-accept and false-reject rates measured
here to real users. Second, thresholds need periodic recalibration as the
receiver, environment, or enrolled population changes, and that
recalibration must reuse the enrolled validation split, not live
unknown-device traffic, or the leakage this paper warns against
reappears in production. Third, this score should function as one layer
of defense in depth rather than a standalone gate: a low-confidence
attempt should trigger additional verification, a step-up challenge or an
operator alert, rather than an outright block, which is the design that
matches the current level of evidence.

Finally, we are explicit about what this study did not measure:
cross-day and cross-environment drift, robustness under active spoofing
attack, and performance at enrolled populations much larger than tested
here (50+ devices). A larger enrolled population likely increases the
chance of an unknown device colliding with some enrolled identity at any
fixed threshold, so the numbers reported here are, if anything, more
optimistic than a real large-scale deployment would see.

## 6. Data and Reproducibility

All three datasets used in this study are public. WiSig (Hanna,
Karunaratne, Cabric, 2022) is CC BY-NC-SA 4.0, restricted to
non-commercial research validation. INRIA PLA (Zenodo record 18268648)
and WIDEFT (Zenodo record 4116383) are both CC BY 4.0 and commercially
usable. The evaluation protocol fixed the following in advance:
thresholds are calibrated only on the enrolled-device validation split,
with unknown-device data exposed only at test time; the known/unknown
split is device-disjoint; AUROC and EER are always reported alongside
TAR at FAR=10%/1%/0.1%; K is reported at K=1 as the primary result with a
single pre-registered K as supplementary context, never re-selected
after seeing results; and small device-count point estimates carry
device-level bootstrap confidence intervals. Evaluation scripts and exact
hyperparameters are available on request.

## References

1. Hanna, S., Karunaratne, S., & Cabric, D. (2022). WiSig: A Large-Scale
   WiFi Signal Dataset for Receiver and Channel Agnostic RF
   Fingerprinting. Dataset. License: CC BY-NC-SA 4.0.
2. INRIA PLA Physical-Layer Authentication Dataset. Zenodo record
   18268648. License: CC BY 4.0.
3. WIDEFT Dataset. Zenodo record 4116383. License: CC BY 4.0.
4. Desplanques, B., Thienpondt, J., & Demuynck, K. (2020). ECAPA-TDNN:
   Emphasized Channel Attention, Propagation and Aggregation in TDNN
   Based Speaker Verification. Interspeech 2020.
5. He, K., Fan, H., Wu, Y., Xie, S., & Girshick, R. (2020). Momentum
   Contrast for Unsupervised Visual Representation Learning. CVPR 2020.
6. Deng, J., Guo, J., Xue, N., & Zafeiriou, S. (2019). ArcFace: Additive
   Angular Margin Loss for Deep Face Recognition. CVPR 2019.
