# A Reproducible Open-Set Evaluation Protocol: Why Closed-Set Accuracy Must Not Be Reported as Authentication Capability

**2i** · 2026-07-29

## Abstract

RF fingerprinting (RFFI), the practice of identifying a physical device from
manufacturing-tolerance artifacts in its transmitted waveform, is increasingly
introduced alongside impressive headline numbers claiming that deep learning
beats classical signal processing. This paper deals with one question that
must be answered before any such number is taken at face value: does the
number actually answer the question we care about? We show the weight of that
question with one concrete, measured case from a public-dataset lineage. Under
a protocol that selects the best-performing combination after seeing held-out
results, the same model lineage reports AUROC 0.9994, a number that reads as
near-perfect. But the metric that authentication actually needs to answer, the
fraction of legitimate attempts accepted at a fixed low false-accept rate
(TAR@FAR), falls to 0.8765 for the exact same fused-packet condition, and
collapses further to 0.2235 once the evaluation is redone under a strict
protocol with a worst-case 1:N impostor and a hard split between the devices
used for threshold calibration and the devices used for evaluation. All three
numbers are measured, not fabricated, and yet they point to different
conclusions. What produces this gap is not the model. It is the rigor of the
evaluation protocol.

This paper does three things. First, it defines why verification and
classification are different problems that require different metrics.
Second, it shows, with measured cases, the two concrete failure paths by
which closed-set accuracy gets misread as evidence of authentication
capability: circularity and information leakage. Third, it presents a
reproducible three-tier evaluation protocol (A/B/C) that explicitly manages
the independent split axes of physical transmitter, receiver, capture
day, environment, and packet burst; treats a worst-case 1:N impostor
scenario, where an unregistered device attempts to pass as any registered
identity, as the standard evaluation target; and requires confidence
intervals to be re-estimated at the physical device or session level
rather than at the packet level. The conclusion is simple. It is not the
tier or architecture of the model but the protocol under which it was
evaluated that decides whether a reported number can be trusted.

## 1. Why the Evaluation Protocol Decides the Outcome

RF fingerprinting identifies a physical device from the reproducible traces
that manufacturing tolerances in the analog transmit chain, oscillator phase
noise, ADC/DAC nonlinearity, power-amplifier response curves, leave in the
radiated waveform. It is attractive precisely because it extracts an identity
signal from the physical layer alone, without embedding an additional
credential, and has been proposed for rogue-device detection on factory
wireless networks and industrial IoT gateway authentication alike. The
problem is that most of these proposals cite, as evidence, an accuracy
figure for a different question: how accurately the system names which
device, among a closed list of known candidates, sent a given signal. Access
control faces a different question. When a device that is not on the
registered list attempts to impersonate a registered identity, can that
attempt be rejected at a low false-accept rate? High accuracy on the closed
question guarantees nothing about the answer to this open one.

The starting point of this paper is showing that this gap is not an
abstract worry. Measuring the same trained-embedding lineage three times,
under three different protocols, leads to three different conclusions.
The first measurement fuses fifty packets and selects, after seeing the
results, the best of eighteen combinations spanning six packet counts and
three scoring methods on the held-out evaluation set; it reports AUROC
0.9994. Given that this combination was chosen after the fact rather than
pre-registered, and that capture days were pooled across both enrollment
and evaluation, this number likely measures not "fifty independent
authentication decisions" but "signal-to-noise-boosted matching within a
single capture session." The second measurement computes, for the same
selected combination, the metric authentication actually needs
(TAR@FAR=1e-3); with post-hoc selection still in effect, it comes to
0.8765. The third measurement assumes a worst-case impostor that attempts
to pass as any registered identity, completely separates the devices used
for threshold calibration from the devices used for evaluation, and
recomputes TAR@FAR=1e-3 for the same fifty-packet fusion condition (K=50);
it falls to 0.2235. If the first number is quoted as reported, the system
reads as a near-perfect authenticator. What the third number actually says
is that, at the same false-accept target, nearly four out of five
legitimate users are rejected.

Because these three numbers measure different metrics (AUROC and
TAR@FAR), it would not be precise to draw a single straight line between
them and say "the model got this much worse." What this paper wants to
stress is different: citing the first number as evidence of authentication
capability without recognizing that it does not sit on the same coordinate
system as the second and third is itself the misreading. Later sections
return to these three numbers and spell out concretely why they occupy
different coordinate systems, and which protocol actually corresponds to
deployment conditions.

## 2. Verification and Classification Are Different Problems

Classification asks "which of the N registered devices sent this signal,"
a task whose defining premise is that the set of correct candidates is
already finite and known. Verification asks a different question: "is
the signal that claims identity X actually X, or is it something else
that was never registered," a binary judgment whose defining premise is
that inputs entirely absent from the candidate list are always present in
the evaluation stream. Access control, authentication, and rogue-device
detection are all verification problems. However high classification
accuracy is, without measuring the rate at which an unregistered input is
mistakenly accepted as a registered identity, one cannot know whether the
system is fit for access control.

This distinction must show up directly in metric choice. Closed-set
accuracy (accK) only checks whether the answer was correct among
registered candidates, and is meaningful only when reported alongside
chance level (1/number of registered devices). Because this metric never
handles unregistered inputs at all, it says nothing about verification
performance. Measuring verification performance requires five families of
metrics.

The Equal Error Rate (EER) is the error rate at the operating point where
the rate of wrongly rejecting a legitimate attempt equals the rate of
wrongly accepting an unregistered one. It summarizes overall separability
in a single number before any threshold has been fixed.

```{=latex}
\begin{equation*}
\mathrm{EER} = \mathrm{FAR}(\tau^{*}) = \mathrm{FRR}(\tau^{*}),
\quad \text{where } \tau^{*} \text{ satisfies } \mathrm{FAR}(\tau)=\mathrm{FRR}(\tau)
\end{equation*}
```

AUROC (area under the ROC curve) is the integral, across all thresholds,
of the probability that a genuine attempt's score exceeds an unknown
attempt's score. It represents overall discriminative power before a
threshold has been chosen.

```{=latex}
\begin{equation*}
\mathrm{AUROC} = P\big(s(x_{\text{genuine}}) > s(x_{\text{unknown}})\big)
\end{equation*}
```

TAR@FAR(tau) is the operating point deployment actually needs. One fixes
a target false-accept rate (FAR) first, then reads off how many
legitimate attempts are accepted (TAR, true accept rate) at that
threshold. AUROC can be high while TAR at a specific FAR is low, and this
paper's central warning sits exactly at that point.

```{=latex}
\begin{equation*}
\mathrm{TAR@FAR}=\gamma \;:\quad \mathrm{TAR}(\tau_\gamma), \quad
\text{where } \tau_\gamma \text{ satisfies } \mathrm{FAR}(\tau_\gamma) = \gamma
\end{equation*}
```

OSCR (open-set classification rate) combines classification and
verification in a single curve. At each false-accept level, it plots the
fraction of accepted, non-rejected legitimate attempts that were also
correctly classified to their registered identity. It penalizes both a
system that verifies correctly but classifies wrong, and one that
classifies correctly but fails to reject unregistered inputs.

Finally, calibration metrics, ECE (expected calibration error) and the
Brier score, are needed. Most verification systems output a continuous
confidence score rather than a binary decision, and that score is used as
a risk-fusion layer alongside other signals. When a model reports "90
percent confident," one must confirm that the prediction is in fact
correct roughly 90 percent of the time before that score can safely be
fused with other signals.

```{=latex}
\begin{align*}
\mathrm{ECE} &= \sum_{b=1}^{B} \frac{|n_b|}{N} \left| \mathrm{acc}(b) - \mathrm{conf}(b) \right|
\qquad \text{(}B\text{ equal-width bins, default } B=15\text{)} \\
\mathrm{Brier} &= \frac{1}{N}\sum_{i=1}^{N} \big(p_i - y_i\big)^2
\end{align*}
```

How confidence intervals are computed matters as much as which metric is
chosen. RFFI-style experiments typically evaluate signals from a few dozen
physical devices, cut into thousands to tens of thousands of packets. The
true independent unit here is the physical device (or capture session),
not the packet. Packets from the same device and the same session are
correlated. Bootstrapping a confidence interval by resampling tens of
thousands of packets makes the interval artificially narrow. The true
sample size is the number of devices, usually eight to twenty-four, and
the confidence interval must be re-estimated by resampling whole devices
(or sessions) at a time. Skipping this distinction creates the illusion
that sampling variability is far smaller than it actually is.

## 3. The Trap of Circularity and Leakage: One Signal, Two Different Truths

Closed-set accuracy gets misread as authentication capability along two
main paths. The first is a metric swap, reporting classification accuracy
and citing it as if it were verification performance. The second is
using the correct verification metric but on a data split that leaks
information, so the number measures a task far easier than actual
deployment conditions. Both are shown below with measured cases.

**The first trap: an impressive closed-set accuracy, a bleak
authentication operating point.** Laid side by side, results from the
same experiment on a public-dataset lineage make this trap plain. Under a
relatively easy condition, eight registered devices, the same receiver,
the same capture session, closed-set accuracy (accK) is 82.0 percent, well
above chance level (1/8 = 12.5 percent), an impressive figure. Yet the
metrics that authentication actually needs, measured on the exact same
experiment and the exact same embedding, tell a different story. AUROC
remains high at 0.881, but TAR@FAR=1% is 20.8 percent and TAR@FAR=0.1% is
just 2.9 percent. Citing the 82.0 percent closed-set figure alone makes
this system sound usable for authentication, but fixing FAR at 0.1
percent means 97 out of 100 legitimate users are rejected. Measuring the
same lineage under a harder condition, a real cross-receiver split where
the receiver is swapped, closed-set accuracy itself drops to 50.4
percent, and TAR@FAR=0.1% stays at 2.7 percent. Closed-set accuracy
differs sharply between the two conditions (82.0 percent versus 50.4
percent), yet neither condition recovers a usable hard-authentication
operating point. Closed-set accuracy is itself a metric that swings
heavily with protocol difficulty, and no value it takes speaks for
verification performance.

**The second trap: circularity, a fingerprint that memorized the receiver
rather than the device.** Running a separate task on the same feature
set, guessing which of twelve receivers received a given signal, at a
chance level of 1 in 12 (8.3 percent), yields an accuracy of 96.4 percent.
Device-identification accuracy on the exact same feature set was 92.1
percent, lower than receiver-identification accuracy. That is, this
feature set memorizes receiver identity better than device identity. This
mechanically explains why performance collapses when the receiver is
swapped. Switching to a different feature set, one known to depend less
on the receiver, reduces this leakage: receiver-identification accuracy
falls to 83.1 percent and device-identification accuracy sits at 83.5
percent, a 13.3-percentage-point reduction in leakage, yet 83 percent
receiver information remains overwhelmingly present. What this experiment
shows is that a large fraction of an apparently correct "device
identification" result can actually be "receiver identification." Splits
that enroll and evaluate on the same receiver never surface this
circularity; it hides disguised as performance.

We now return to the three numbers promised in the introduction. AUROC
0.9994, reported for the best-of-eighteen combination chosen after seeing
the held-out results, already falls to 0.8765 when the metric
authentication actually needs (TAR@FAR=1e-3) is computed for the exact
same combination. Assuming a worst-case impostor that attempts to pass as
any registered identity, and completely separating the devices used for
threshold calibration from the devices used for evaluation, recomputing
the same fused-packet condition (K=50) drives it down to 0.2235. The
optimistic sweep's TAR@FAR=1e-3 (0.8765) and the worst-case protocol's
identical metric (0.2235) compare the exact same metric at the exact same
packet count. The gap between them is still nearly fourfold. The only
variable producing that gap is not the model. It is the evaluation
protocol.

```chart
{"kind":"bar","title":"Gap between an optimistic and a strict protocol (same lineage, K=50 fusion, measured)","labels":["AUROC (post-hoc best combination)","TAR@FAR=1e-3 (same optimistic sweep)","TAR@FAR=1e-3 (1:N worst case, device-disjoint)"],"series":[{"name":"measured value","values":[0.9994,0.8765,0.2235]}],"note":"These three values measure different metrics under different protocols. Comparing them as if they were the same number is exactly the misreading this paper warns against."}
```

It is also worth confirming that this gap is not a fluke of one particular
dataset. A dedicated open-set verification method reported in the
literature, using structural anchoring and rejection-oriented alignment on
the same public-dataset lineage, reports OSCR 0.958 and FPR@TPR90 0.047
under a single-decision condition. Our own measurements under the same
condition give OSCR between 0.326 and 0.622 and unknown-rejection rates
between 10.8 percent and 29.4 percent. The gap between our own
single-packet condition and this comparison point shows, once more, that
open-set verification is genuinely difficult and that no single impressive
headline number is enough to clear that difficulty.

## 4. A Recommended Protocol: A/B/C

All of the cases above share one cause. Information that leaks in
RFFI/receiver verification almost always originates from one axis shared
between training and evaluation. A reproducible evaluation manages the
following six axes explicitly, and any experiment should document how
each one was handled.

| Split axis | What it is | Why it leaks if unmanaged |
|---|---|---|
| Transmitter / device instance | The object the fingerprint targets | Packets from the same device split across train/eval make memorization look like generalization |
| Device model / chipset | Model-specific spurious signal | Model-specific artifacts mix with the fingerprint |
| Receiver (rx chain) | Antenna, RF front end, ADC | Receiver characteristics blend into the fingerprint, becoming "memorized the receiver" |
| Capture day / session | Temperature drift, clock drift, environment | Same-day captures share correlated noise |
| Environment / location | Indoor/outdoor, distance, multipath | Environment-specific channel characteristics entangle with the fingerprint |
| Packet / burst group | Consecutive packets from one capture | Adjacent packets share correlated channel and timing, so random splitting effectively splits within one capture |

One rule among these admits no exception: never split the same
continuous capture (burst) across training and evaluation. Packet-level
random splitting inflates performance artificially because adjacent
packets share channel and timing correlation. At minimum, whichever axis
(device, receiver, or day) the experiment is meant to test must be an
explicit hold-out.

Reporting the same experiment at three levels of how strictly these six
axes are managed exposes the gap between "lab numbers" and "deployment
numbers." Every experiment should report at least one tier explicitly
labeled, ideally A and B together, and C before productization.

**Protocol A (research baseline).** Uses the same receiver and the same
or adjacent capture day, holding out only unregistered devices. Registered
devices are part of the enrollment procedure; unregistered devices never
appear in training or enrollment. This protocol should only be used to
check the ceiling of a backbone or scoring method, never cited as
evidence of product performance, and must always carry the caveat that it
holds only under this condition.

**Protocol B (practical open set).** Separates registered and
unregistered devices exactly per the open-set definition, keeps the same
receiver, but separates the capture day/environment at evaluation time
from training time. Unregistered data is never used for threshold
decisions or model selection. If information about unregistered devices
leaks into hyperparameter or threshold tuning, open-set performance is
optimistically inflated. Thresholds are chosen only on the validation
split of registered devices.

**Protocol C (product grade).** Completely holds out the actual receiver
that will be deployed. Data from that receiver is used only for
enrolling registered devices, never for model training, hyperparameter
tuning, or threshold calibration. The deployment-time capture day and
environment are also held out, simulating the real-world condition that
the deployment environment differs from the training environment.
Registered devices are only allowed an enrollment step on the new
receiver, which mirrors the real product procedure of "enrolling an
existing device on a new receiver." Evaluation defaults to a worst-case
1:N impostor scenario: assuming that every unregistered device attempts
to impersonate whichever registered identity it is closest to, and
measuring the pass rate of that best-case impersonation attempt. This
scenario produces the only number honest enough to cite in a product or
defense brief.

Measuring under Protocol C's worst-case condition also reveals that
fusing more packets, and thereby accepting longer decision latency, helps
somewhat but is not a complete fix. The table below re-measures the same
system while increasing the number of fused packets (K).

| K (fused packets) | TAR@FAR=1e-3 | TAR@FAR=1e-4 |
|---|---|---|
| 1 | 0.16% | 0.01% |
| 20 | 6.79% | 1.60% |
| 50 | 22.35% | 13.11% |
| 100 | 43.33% | 22.00% |

Even at K=100, four out of five legitimate users are still rejected at
the strictest target (FAR=1e-4). Looking at AUROC alongside this
condition, AUROC at K=20 remains high at 0.863, while TAR@FAR=1e-3 at the
same K is only 6.8 percent. This paper's central warning, that a high
AUROC and a usable authentication operating point are not the same
thing, is reconfirmed here as well.

```chart
{"kind":"line","title":"Fusing more packets (K) still misses the target false-accept rate (1:N worst case, measured)","labels":["K=1","K=20","K=50","K=100"],"series":[{"name":"TAR@FAR=1e-3","values":[0.0016,0.0679,0.2235,0.4333]},{"name":"TAR@FAR=1e-4","values":[0.0001,0.016,0.1311,0.22]}]}
```

Protocol C also reveals that separating capture days is a harsher
condition than swapping receivers. Under the same worst-case 1:N design,
when training and evaluation are at the same point in time, AUROC is
0.9515 and closed-set identification accuracy is 88 percent. Moving
evaluation to a capture two to three days in the future drops AUROC to
0.7981 and closed-set identification accuracy to 47 percent. Under the
same design, swapping only the receiver dropped AUROC by an amount
observed between 0.605 and 0.722, smaller than the degradation from
capture-day separation. This means that in real deployment, time-related
factors such as temperature drift and clock offset can be a bigger threat
than hardware swaps, and re-enrollment interval should be treated as a
core product design variable.

```chart
{"kind":"bar","title":"Cross-day separation is harsher than swapping receivers (same 1:N design, measured)","labels":["Same-time control","2-3 days later (cross-day)"],"series":[{"name":"AUROC","values":[0.9515,0.7981]},{"name":"closed-set ID accuracy","values":[0.88,0.47]}],"note":"Under the same design, swapping the receiver dropped AUROC by an amount observed between 0.605 and 0.722, smaller than the cross-day degradation."}
```

Before closing this section, a checklist for writing up a new experiment
report is worth stating explicitly. State, in one line each, how each of
the six split axes was managed (or explicitly note "not applicable" with
a reason). Label which protocol (A/B/C) was used, in a table. Report
closed-set accuracy, AUROC, AUPRC, OSCR, EER, TAR@FAR (at FAR 10%/1%/0.1%),
FPR@TPR (at TPR 90%/95%), ECE, and Brier score in full, to prevent
cherry-picking a favorable subset. State whether confidence intervals are
bootstrapped at the device/session level rather than the packet level.
And confirm that unregistered data never entered threshold decisions or
model selection.

## 5. Limitations

We are explicit about what this paper does not measure. Robustness under
active spoofing or replay attacks is not addressed; whether
high-fidelity replayed signals are indistinguishable from the baseline
remains an open question requiring separate verification. Performance at
enrolled-device populations much larger than tested here (tens to hundreds
of thousands of devices) is out of scope. As the registered population
grows, the probability that some unregistered device happens to be close
to some registered identity increases, so it is safer to treat even the
worst-case numbers reported here as, if anything, optimistic relative to
real large-scale deployment. Point estimates from small samples (eight to
twenty-four known devices) carry real sampling variability, which is not
a computational error but a genuine property of small-sample estimation.
Finally, the six-axis split rule and A/B/C protocol presented here were
extracted from the specific task family of RFFI/receiver verification;
carrying them over to other biometric or behavioral authentication tasks
requires re-identifying the split axes appropriate to each task.

## 6. Reproducibility

The core contribution of this paper is the protocol and metric
definitions, not a specific model, so the unit of reproducibility is the
protocol, not the model. A researcher aiming to reproduce these results
can follow the procedure below directly. First, before touching a
dataset, confirm the metadata for each of the six axes (transmitter,
device model, receiver, capture day/session, environment, packet/burst
group), and explicitly hold out at least the axis the experiment is meant
to test. Second, enforce burst-id-level group splitting in the split
script so that packets from the same capture never appear on both sides
of training and evaluation. Third, fix thresholds only on the validation
split of registered devices, and expose unregistered data only at the
final evaluation stage. Fourth, compute and report closed-set accuracy,
AUROC, AUPRC, OSCR, EER, TAR@FAR, FPR@TPR, ECE, and the Brier score in
full, and re-estimate confidence intervals by bootstrapping at the device
(or session) level. Fifth, when reporting Protocol C, assume that every
unregistered device constructs its best possible impersonation attempt
against every registered identity, and compute TAR@FAR from the pass
rate of that best attempt. These five steps are not tied to any
particular vendor or backbone, and can be reproduced directly on public
open-set RF fingerprinting datasets. The three-step gap cited in this
paper, from AUROC 0.9994 through TAR@FAR=1e-3 of 0.8765 down to 0.2235,
is exactly what this procedure reproduces.

## References

1. Hanna, S., Karunaratne, S., Cabric, D. (2022). *WiSig: A Large-Scale
   WiFi Signal Dataset for Receiver and Channel Agnostic RF
   Fingerprinting.* Real over-the-air captures, 150 transmitters by 18
   receivers by 4 days. License: CC BY-NC-SA 4.0 (non-commercial only).
2. INRIA PLA I/Q RF Fingerprinting Dataset. Zenodo record 18268648.
   License: CC BY 4.0 (commercial use allowed).
3. WIDEFT Dataset (Physical Science Laboratories / NMSU). Zenodo record
   4116383. License: CC BY 4.0 (commercial use allowed).
4. CRODA-ST: structural-anchor and rejection-oriented alignment for
   open-set RF fingerprint identification. arXiv:2607.02567. Reference
   SOTA (WiSig strict cross-receiver open set): OSCR 0.958, FPR@TPR90
   0.047, AUROC 0.9692 (single-decision condition).
5. The definitions of the open-set verification metrics used here (EER,
   AUROC, TAR@FAR, OSCR, ECE, Brier score) and the device/session-level
   bootstrap confidence-interval procedure follow a fixed internal
   evaluation protocol specification (unpublished), applied to the
   public datasets in references 1-4 above for the measurements reported
   here.
