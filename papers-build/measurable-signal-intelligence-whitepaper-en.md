## Summary

This white paper ties the thirty-four experiment notes published on the 2i board into a single
argument. The subjects are scattered across audio content identification, WiFi channel-state
sensing, RF fingerprint authentication, predictive maintenance, edge deployment and
quantisation, large-scale agent retrieval, and backtest discipline in finance. The conclusion
converges on one point.

**Whether an AI deployment succeeds is decided by measurement discipline, not by the model.**
Three of the thirty-four notes showed the same thing independently, in different fields. With
the model and the data held fixed, changing only the evaluation protocol moves accuracy from
0.931 to 0.088, and a verification metric from 0.9994 to 0.2235. Neither figure is fabricated.
Both are honestly computed; they simply answer different questions.

What this paper sells, then, is not a particular technology but a **procedure for deciding**:
draw the line of what works and how far in numbers, and state where it stops first.

## 1. Thesis: read the procedure, not the number

An AI proposal usually arrives with a single accuracy figure. 95%, 98%, 0.99. Most of these are
not fabricated. The problem is that nothing states **which question the number answers**.

Three notes on our board measured this from different angles.

First, how the data is split. Holding data and model fixed on WiFi sensing data and changing
only the split protocol moved accuracy from 0.931 to 0.088. With sixteen classes, chance is
0.0625, so the latter classifies nothing. More important is the composition of the gap.
Adjacent-frame leakage, the failure most often cited, accounted for 1.7 to 5.8 percentage
points; domain shift across people and setups accounted for 77.7 to 81.6. Fixing the leakage
leaves most of the problem intact.

Second, the difficulty of the evaluation scenario. The same RF fingerprint model returns AUROC
0.9994 under an optimistic protocol and a detection rate of 0.2235 at a 0.1% false-alarm
operating point when unregistered devices attempt impersonation. An access-control product
requires the latter.

Third, how detection performance is phrased. In interference detection, "we caught N per cent"
is meaningless unless the false-alarm rate is fixed, because lowering the threshold always
raises detection. We therefore fix the false-alarm rate first and report detection under that
constraint.

The three notes came from different data, different tasks, and different contexts, and arrived
at the same place. **The procedure makes the number.** Judgement about adoption must therefore
examine the procedure, not the figure.

## 2. The gauge method: measure, prove, hand over

2i treats AI transformation as a process rather than a hunch. Three gates cut the risk at each
stage.

**Measurement gate.** Before deciding what to improve, measure the current state. It is not rare
for a project to end here, because the problem turned out to differ from the assumption, or
because a rule-based approach already suffices. This is why we do not reach for deep learning
first in anomaly detection.

**Proof gate.** Check whether the proposed improvement actually beats the baseline on the
customer's data. Five disciplines apply: declare the acceptance criterion in advance, confirm
the chance level with a shuffle control, fix the false-alarm rate before quoting detection,
block data leakage, and publish negative results as they are.

**Hand-over gate.** Deliver in a form the operating organisation can run alone. If it cannot be
handed over, it is not finished.

The cost of this method is plain: it is slow, and a project that ends at the measurement gate
produces no revenue. What it buys is that the cases which pass do not collapse in the pilot.

## 3. Maturity ladder: where the thirty-four notes sit

Not every experiment carries the same weight, so we sort them into four tiers. **Failing to keep
this separation would make the white paper itself the kind of overstatement it criticises.**

| Tier | Definition | Citable as | Notes |
|---|---|---|---|
| Validated | Measured on public real data or real hardware | Performance evidence within the stated conditions | 17 |
| Extended | Real and synthetic axes mixed | Real axis only; synthetic axis is directional | 5 |
| Research | Entirely synthetic or simulated | Method plausibility only, not performance evidence | 8 |
| Concept | Methodology without data | Explains how we work | 3 |

```chart
{"kind":"bar","labels":["validated","extended","research","concept"],"series":[{"name":"experiment notes","values":[17,5,8,3]}],"ylabel":"number of notes"}
```

### Validated (17 notes)

Measured on public real data or on real hardware. Representative figures only.

In wireless sensing, occupancy detection on public channel data gave a walking signal 52 times
the empty-room level, with 10-second window separability at AUROC 1.000. That result is from a
single room and a single session. Why that caveat is decisive is answered by the split-protocol
experiment: change the person and the same pipeline falls to chance. The cross-environment study
then showed that the collapse is substantially recovered with a small number of labelled target
trials per class. Read together, the three notes give one conclusion: camera-free sensing works,
but every site needs calibration, and the amount of calibration is the deployment cost.

In RF fingerprint authentication, 150 real transmitters gave AUROC 0.80 under a same-receiver
condition, while detection at a 1% false-alarm rate reached only 22%. Across three public
datasets separability reaches AUROC 0.87, but at the low false-alarm operating point access
control requires it collapses to 2~3%. On that basis we issued a NO-GO for a hard authentication
product and proposed a calibrated risk score as the honest alternative; the expected calibration
error of raw probabilities, 0.045, was nearly halved by calibration. A probe-point ablation
showed the fingerprint is strongest early in the receive chain and is erased through
synchronisation, which tells you where to measure.

In predictive maintenance, physics-based features beat a naive approach by 33 percentage points
at factory noise levels on public vibration data, with no deep learning.

In edge deployment, a signal-processing pipeline reached 0.19 times the target throughput on a
low-cost edge core, with the bottleneck attributed stage by stage. On quantisation,
post-training quantisation cost 31 percentage points of accuracy and quantisation-aware training
recovered 94.5% of that loss, while size and latency gains were identical on both paths. On
consumer silicon, holding 4-bit precision fixed and changing only the runtime moved decode
throughput by a factor of 190, which means quantisation alone is insufficient without a fused
kernel runtime.

In audio content identification, a 999-track catalogue gave 95% clean and 72.5% top-1 under
heavy noise, and accuracy held in the high nineties when scaled to 7,996 tracks. Extrapolating
an in-memory index to one million tracks, however, requires roughly 868GB. Scaling up revealed
that the real bottleneck is the index structure, not the algorithm.

The boundary between classical and deep methods was measured as well. On physics features with
539 training samples, boosting reached 0.855 against 0.681 for raw-signal deep learning. The gap
narrows as samples grow, so our criterion for selling deep learning is not theoretical
superiority but a measured win over the classical baseline at the data scale in hand.

### Extended (5 notes)

Real and synthetic axes mixed. In the predictive maintenance study, vibration used public real
data while acoustics were synthetic; the acoustic result is directional, not performance
evidence, and the note says so. The million-song sharded index is treated the same way, being an
arithmetic projection built on a real catalogue with synthetic fill.

### Research (8 notes)

Entirely synthetic or simulated. Interference detection at 98.0%, interferer localisation with a
median error of about 7m, and fixed-false-alarm industrial detection at Pd 0.980 belong here.
**These numbers are not used as product performance claims.** They confirm that a method holds
in principle on a physical model, without field factors such as indoor multipath.

Backtest discipline and market regime detection also sit here. On synthetic series, controlled
experiments isolated look-ahead bias inflating the Sharpe ratio by up to a factor of 21. This is
measurement methodology, not investment advice.

### Concept (3 notes)

The gauge method, the rules-first principle, and the five measurement disciplines. These
describe how we work and carry no data.

## 4. Usage map: which question, which notes

| Question | Note family | What can be answered today |
|---|---|---|
| Measure space occupancy without cameras | WiFi-CSI, 4 notes | Single-space occupancy is validated; changing space or people requires recalibration |
| Find unregistered wireless devices | RF fingerprint, 6 notes | Viable as asset-inventory support; hard access control is NO-GO |
| Anticipate rotating-equipment failure | Predictive maintenance, 2 notes | Vibration validated; acoustics not yet validated on real data |
| Monitor broadcast music copyright | Audio content ID, 3 notes | Accuracy validated to 8k tracks; one million requires index redesign |
| Put a model on edge hardware | Edge and quantisation, 3 notes | Budget attribution and quantisation path selection are validated |
| Decide whether deep learning is needed | Classical vs deep, 3 notes | A regime where classical wins genuinely exists at small sample sizes with physics features |
| Deploy interference or anomaly detection | CFAR family, 4 notes | Methodology established; field measurement is the next step |
| Build an agent with many tools | Retrieval routing, 1 note | Synthetic corpus result; re-measurement on a real ecosystem needed |

## 5. Honest boundaries

**More than half of the notes cannot be used directly as commercial performance evidence.** Of
the thirty-four, eight use non-commercial datasets and ten carry no stated dataset licence.
Research citation is unaffected, but using them as performance evidence in a specific client
proposal requires re-measurement on explicitly permissive data or on the client's own data.
Keeping that distinction sharp is part of what we sell.

**Working well on public data does not guarantee working well in the field.** Three failure
points recur. Change the receiver or the equipment and the fingerprint collapses. Change the
space or the person and sensing accuracy collapses. Scale up and the bottleneck moves from the
algorithm to the infrastructure.

**We do not delete our NO-GO cases.** We judged open-set RF hard authentication to fall short of
a sellable standard with current technique and published the evidence. We also left standing the
experiment in which sophisticated extreme-value calibration failed to beat a simple
distance-based score. A board that still carries its failures is more trustworthy than one that
carries only successes.

**Duplication is on the cleanup list.** The edge budget attribution work is posted twice, as a
short and a long version of the same experiment. They will be merged at the next pass.

## Data and reproduction

- Scope: the thirty-four notes on the public 2i board, excluding this paper. Each note carries
  its own data, limitations, and licence statement.
- Every figure quoted here is a measurement from those notes. This paper computes nothing new.
- The real versus synthetic classification was made by checking each note's "data and
  reproduction" section; that classification is the maturity ladder above.
- Figures derived from synthetic data are placed only in the research tier and are not cited as
  product performance claims.
- This is version 5, replacing version 4, which covered the board when it held twenty notes.
