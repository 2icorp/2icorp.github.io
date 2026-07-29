## Summary

This white paper ties together 19 technical papers that 2i has produced. Spanning six
industries - media, sensing, security, industrial equipment, edge and AI infrastructure, and
finance - these papers look nothing alike on the surface. A broadcaster wants to know which
song in the catalog a short audio clip belongs to. A care facility wants to know whether
someone is present in a room, or has fallen. A factory wants to know whether a bearing's
vibration has left its normal range. An agent platform wants to know whether search actually
surfaces the right tool once the tool count crosses a thousand. A quant fund wants to know
whether a backtest's performance will survive contact with live trading. These five questions
all reduce to the same underlying structure: extract features from a signal (sound, radio
frequency, vibration, text query, time-series return), then decide whether those features have
drifted from a normal, enrolled, or known state. Anomaly detection, open-set identification,
and retrieval confidence are one judgment logic wearing different faces.

The real thesis running through this white paper is not industry expansion itself, but the
measurement discipline that makes that expansion trustworthy. Five principles repeat across
domains in different clothing: pre-registering what is being measured before the experiment
runs, running shuffled control comparisons alongside real signals, comparing performance at a
fixed target false-alarm rate rather than accuracy alone, blocking data leakage across time or
partition boundaries, and publishing negative results as readily as positive ones. The fact
that a constant-false-alarm-rate (CFAR) discipline radar engineers built half a century ago
hits its target within about 0.02 percentage points when transplanted into both industrial
wireless interference detection and financial market-regime alerting - and the fact that
measurement overturned the assumption that hybrid retrieval always wins - is evidence that
this discipline is not just rhetoric.

The 19 papers are not uniformly mature, and this white paper does not hide that. Thirteen
confirmed their results on real, public data; six are still at the synthetic-data or
methodology stage. Negative results, the places where conventional wisdom broke, are published
as-is: hybrid retrieval failing to beat a single retriever, open-set RF fingerprint
authentication collapsing at the false-alarm rates access control actually needs, and deep
learning losing badly to boosting on small data. The three finance papers are methodology
research and not investment advice.

## 1. Why Measurement Discipline: One Logic, Six Industry Faces

Companies selling AI transformation usually build a different story for each industry: vision
inspection for manufacturing, content recognition for media, predictive models for finance.
That approach is not wrong, but it misses something. Many problems across different
industries differ only in surface form and ask the same mathematical question underneath.
"Is this sound the song we know?" (audio fingerprinting), "Is someone in this room right
now, and did they fall?" (WiFi sensing), "Did an enrolled device send this signal, or an
unknown one?" (RF fingerprinting), "Has this bearing's vibration left its normal range?"
(predictive maintenance), "Does the tool that matches this user request actually rank near
the top of search results?" (agent retrieval), and "Is this backtest return better than
chance?" (finance) are all, underneath their different wording, the same math problem: deciding
whether features extracted from a signal have drifted from a normal, enrolled, or known
state - anomaly detection, open-set classification, and retrieval confidence.

What 2i has confirmed repeatedly across 19 papers is not this judgment logic itself, but the
method for measuring honestly whether it works. It comes down to five principles. First,
pre-register what is being measured and what counts as success before the experiment runs.
Second, run a shuffled control alongside the real signal to separate skill from chance. Third,
do not look at accuracy alone; compare performance at a fixed target false-alarm rate. Fourth,
block the paths by which training, validation, and evaluation data leak across time or
partition boundaries. Fifth, publish results that go against conventional wisdom or hurt the
narrative exactly as they came out. Why these five principles matter is proven directly by the
papers in this library: the discovery that a WiFi-CSI benchmark's own official data split was
itself a leakage source, the fact that the same RF fingerprint model's AUROC swings from
0.9994 to 0.2235 depending only on evaluation method, and the fact that a single look-ahead
bias inflates backtest performance by 21 times, are demonstrations of why principles four,
three, and one respectively have to exist.

## 2. The Gauge Method: From Measurement to Handoff

2i splits every project into three gates. The measurement gate is the cheapest step: confirm,
using public or synthetic data, whether a method captures a statistically significant signal
at all. The validation gate re-checks that method against a client's real data, real
false-alarm-rate targets, and real hardware budget. The handoff gate puts a validated method
into an operating pipeline and monitors its performance continuously. Each gate must earn the
cost of the next one - a method that fails the measurement gate is never pushed into
validation.

The 19 papers in this library have mostly cleared the measurement gate, and some have already
been re-validated on real data. Five papers - audio content fingerprinting, device-free WiFi
sensing, equipment vibration predictive maintenance, and the RadioML-based edge optimization
work - are close to demonstrated maturity on public real-world data. By contrast, backtest
discipline, CFAR regime detection, agent retrieval, and the RF fingerprint probe-point ablation
study are still at the measurement-gate stage: synthetic data has confirmed the methodology is
statistically meaningful, nothing more. Hiding this distinction would sell a demonstrated
result and an idea to a client with the same confidence. 2i does not sell that way.

The reason for splitting into three gates is cost. The measurement gate finishes in a day to a
few days using public datasets or locally generated synthetic data. The validation gate takes
days to weeks because it requires re-measuring on a client's actual signal, and the handoff
gate is an ongoing cost of attaching continuous monitoring to a production environment.
Pushing a method that cannot be statistically distinguished from chance at the measurement
gate - one whose performance gap between the shuffled control and the real signal is not
significant - into validation wastes a client's time and money. So 2i's gauge method always
asks, at every gate, "is there evidence to move to the next stage," and stops on the spot if
there is not.

## 3. The Paper Library: 19 Papers Across Six Industries

Eighteen of the 19 papers fall cleanly into the six industry clusters below. The remaining
one - a decision-map paper that pits classical signal processing and gradient boosting against
deep learning across six signal tasks - cuts across every cluster and answers Section 4's
"when does classical win, when does deep learning win" question directly, so it is treated
separately.

```chart
{"kind":"bar","title":"Share of demonstrated-stage papers by cluster (of 18; parentheses show raw counts)",
 "labels":["Media (2/2)","Sensing (2/2)","Security (3/4)","Industrial (1/2)","Edge/AI (4/5)","Finance (1/3)"],
 "ylabel":"Demonstrated share",
 "values":[100.0, 100.0, 75.0, 50.0, 80.0, 33.3]}
```

Media and sensing confirmed both of their papers on public real-world data. Security
confirmed three of its four papers on real data, with only the probe-point ablation study
relying on a synthetic device fleet. Finance confirmed only one of its three papers (factor
return prediction) on real data - the other two (backtest discipline, regime detection) are
methodology experiments, and this ratio shows that plainly.

### 3.1 Media / Content-ID

Two papers extended audio fingerprinting under real measurement. The first confirmed, on 999
GTZAN tracks, a clean 10-second-clip top-1 accuracy of 95.0%, a figure that held at 72.5%
under strong noise (SNR -5dB) and 96.7% under MP3 compression down to 32kbps. A naive matcher
without time alignment collapsed from 87.5% to 2.0% at SNR 0dB under the same conditions.
Scaling the catalog 16x, from 500 to 7,996 tracks on FMA-small, barely moved clean accuracy
(99.5% to 99.0%), while the naive baseline collapsed from 37.5% to 17.0%. The real bottleneck
this measurement exposed was not accuracy but memory: at roughly 0.889MB per track, a
single in-memory dictionary extrapolated to a million-song catalog would need about 868GB.

The second paper tackles that memory bottleneck head-on. Sharding the index by exact hash-key
partition preserves accuracy exactly across 1 to 32 shards (140 of 140 queries correct,
identically, at every step of the 32x scale-up). But the paper does not hide that sharding
does not fully solve the problem. Because a fixed per-process overhead (about 180MB)
duplicates once per shard, total fleet memory at million-song scale actually grows to 1.18x
the monolithic estimate at a 6,000-track shard capacity, and balloons to 2.17x at a
1,000-track capacity. And even at 32 shards, a single query still touches 99.98% of all
shards - routing reduces the data volume per shard, not the number of shards a query contacts.

### 3.2 Sensing / WiFi-CSI

Device-free WiFi-CSI sensing hit a 95.2% seven-class activity accuracy (macro F1 92.7%), a
0.990 fall-detection AUROC (97.6% precision, 91.1% recall at a 0.5 threshold), and a 1.000
occupancy-detection AUROC on real UT-HAR and OPERAnet data. The paper itself states plainly
that this is a research feasibility demo, not a clinically certified medical device.

The cross-environment calibration paper exposes the other side of that result. Measured on
UT-HAR's official train/val/test split, accuracy barely drops (94.7-94.9% vs. 95.2%) - a
figure the paper attributes to data leakage from overlapping sliding windows rather than a
real domain-shift test. Constructing a verifiable, unsupervised pseudo-domain split instead,
the paper re-measures a genuine domain shift: accuracy collapses to 55.08%, a 37.29
percentage-point gap against the same-domain ceiling of 92.37%. Adding just 50 labels per
class - 350 total, 9.7% of the source training set - recovers accuracy to 84.92%, closing 80%
of that gap. The team that measured on the official split, applying the same calibration
technique, recovered only -4.4% to +0.6%, because there was little real gap left to recover
in the first place.

### 3.3 Security / RF-Fingerprint

Four papers show this white paper's most honest boundary. Open-set RF fingerprint
verification confirmed that separability is real: K=1 AUROC ranges from 0.52 (WIDEFT, near
chance) to 0.87 (INRIA) depending on the dataset, and authentication rate collapses at the
low false-alarm rates access control actually requires. On INRIA, TAR@FAR=1% is 20.8% but
drops to 2.9% at TAR@FAR=0.1%; on WiSig's cross-receiver condition, TAR@FAR=0.1% falls to
0.5%. Fusing ten packets (K=10) raises INRIA's TAR@FAR=1% to 91.4%, but tightening to
FAR=0.1% under the same fusion drops it back to 61.6%.

The reproducible evaluation protocol paper explains why these numbers scatter so widely. The
same embedding, the same model, can report an AUROC of 0.9994 under the most permissive
combination of the 18 tested, or 0.2235 under a strict protocol that fully separates
enrollment and evaluation devices and assumes an unregistered-identity attacker. The same
paper found a closed-set classification accuracy of 82.0% that looks impressive, while the
same experiment's TAR@FAR=0.1% is only 2.9%. The authors put it directly: this measures "the
protocol's leniency, not the model's ability." The probe-point ablation study dug into where
in the receiver chain this fingerprint lives and dies. Equal error rate (EER, lower is
better) was lowest at the raw-IQ stage (0.307), but climbed toward chance (0.489, 0.499) as
the signal passed through standard processing - carrier-frequency-offset correction, matched
filtering, synchronization - that improves communication performance. Drone open-set detection
found that, at low fusion counts (K=1), classical methods rejected unknown devices at 5.7x the
rate of deep learning (0.424 vs. 0.074), though deep learning edges ahead past K=20 (0.875 vs.
0.917). 2i combines these four findings to redefine RF fingerprint authentication as a risk
score tier rather than a single pass/fail gate. Their data licenses are not uniform, either:
WiSig is CC-BY-NC-SA (non-commercial, research use only) while INRIA is CC-BY 4.0
(commercially usable), so commercial productization needs re-validation on the latter family
of datasets.

### 3.4 Industrial / Equipment

The equipment vibration and acoustic predictive maintenance paper explicitly labeled its
vibration data (the standard CWRU bearing-fault dataset) as real and its acoustic data as
procedurally synthesized, marking each result accordingly. On the vibration axis, physics-
feature classification tied a simple baseline at 1.000 under clean conditions, but pulled
ahead 3.4x under strong noise (SNR -5dB: 0.636 vs. 0.186). The acoustic axis showed the same
pattern (0.903 vs. 0.312 clean; 0.492 vs. 0.302 at SNR -5dB), but the paper states outright
that "the largest and hardest-to-hide limitation is that the acoustic results are entirely
synthetic," and names its next step as validation against the real industrial-noise dataset
MIMII (CC-BY-4.0).

The industrial wireless interference detection paper transplanted radar's CFAR discipline
directly: at a 5% target false-alarm rate, CA-CFAR realized 5.29%, an overall detection rate
(Pd) of 98.0%, and a slice-localization accuracy of 98.2% against a 16.7% random baseline.
This paper, too, leaves its honest limitations in place. Jamming with the highest total
transmit power actually had the lowest detection rate (92.9%) due to masking, and spatial
localization error improved 3.7x over baseline (4.98m vs. 18.49m) with no shadowing but
degraded to 18.47m under heavy shadowing (12dB) - nearly matching the baseline again, a
non-monotonic result reported as measured rather than smoothed over. Every number in this
paper comes from a physics-based synthetic simulation, not real radio hardware.

### 3.5 Edge / AI Infrastructure

Five papers answer operational questions with real measurement. The INT8 quantization paper
found that an FP32 baseline's 93.18% accuracy on a RadioML modulation-classification model
fell to 61.91% (-31.27 points) under static post-training quantization (PTQ, calibration
only), but quantization-aware training (QAT, 15 epochs of fine-tuning) recovered it to 91.45%
(-1.73 points) - reclaiming 94.5% of PTQ's loss. Model size shrank 70.3% under both methods,
and QAT was marginally faster in latency as well (0.155ms vs. 0.158ms, p50). The edge budget
attribution paper proved, stage by stage, that a spec promising 40 MSPS on a single Apple M3
Pro core delivered only 0.19x that (7.59 MSPS) in a quiet environment, and 0.09x (3.5 MSPS)
under load. The top three stages consume 85.28% of the budget, and code optimization alone
tops out at 33.1% of the target spec even assuming four concurrent cores.

The tabular boosting versus deep learning paper reconfirmed that LightGBM beats raw-IQ deep
learning by 17.4 percentage points (85.5% vs. 68.1%) at 539 training samples. Scaling to 2,000
samples narrows that gap from 36.0 to 21.3 points (deep learning 36.8% to 58.1%, boosting
72.8% to 79.4%), and the paper is candid that two data points are not enough to say whether the
curves actually cross at 5,000 or 9,900 samples. The calibration paper drove down the
expected calibration error (ECE) of a decision score from 0.0446 to 0.0188 (-57.9%) using
isotonic regression while keeping discrimination (AUROC 0.9374 to 0.93633) essentially intact.
Before calibration, the actual accuracy of the 0.80-0.87 confidence bin was only 0.6441; after
isotonic calibration, the same bin's accuracy rose to 0.8986.

The fifth paper, on large-scale skill-corpus routing, is the most recent addition to this
cluster and overturns conventional wisdom head-on. On a fully public, synthetic corpus of
2,000 tools, pitting pure lexical matching (BM25), a character n-gram TF-IDF surrogate for
semantic search, and a hybrid combining both via reciprocal rank fusion (RRF), Recall@1 for
the hybrid (0.508) tied BM25 (0.508) and trailed TF-IDF (0.517) by a hair. At Recall@5, the
hybrid was the worst performer (0.683) against BM25's 0.742 and TF-IDF's 0.700. The more
important result concerns abstention on unanswerable queries. Applying a score-gate threshold
calibrated so about 90% of answerable queries pass to 41 hard-negative queries, the correct
abstain rate was 26.8% for BM25 and 31.7% for TF-IDF, but only 12.2% for the hybrid - which
confidently returned a top-ranked answer 87.8% of the time on queries that had no correct
answer. The root cause traces to RRF discarding absolute score magnitude in favor of rank
alone. The paper publishes its finding as-is: "the hybrid never decisively beat the best
single retriever."

### 3.6 Finance

The three finance papers are methodology research and not investment advice. The backtest
discipline paper measured three performance-inflating traps on synthetic time series.
Look-ahead bias inflated the average Sharpe ratio from an honest 0.069 to an impossible 21.1
simply by removing a one-day lag; survivorship bias, in a universe where about 20.3% of
constituents delisted over five years, inflated CAGR by 3.8 percentage points when only
survivors were kept (13.9% vs. 10.1%). Without multiple-testing correction, the best in-sample
Sharpe ratio climbed from 0.34 at N=5 trials to 0.90 at N=2,000, while out-of-sample Sharpe
stayed stuck in the noise band (-0.07 to 0.17) regardless of N, and a naive significance
test's false-positive rate rose from 6.7% to 46.7% as N grew. Bonferroni correction and the
Deflated Sharpe Ratio, by contrast, held a 0% rejection rate across every value of N.

The factor return prediction paper is the first in this white paper to use real market data:
Fama-French's daily three-factor series, 25,543 trading days from 1926 to 2023. At a 60-day
training window, a shallow neural network's out-of-sample R² collapsed to -2.60, while
gradient boosting degraded far more gently, to -0.07 - roughly a 35x gap. At 4,000 to 8,000
training days, the neural network (R² -0.09 to -0.08) edges narrowly past boosting (-0.13 to
-0.10), but both remain clearly worse than the trivial mean-baseline (about -0.001).
Directional accuracy stayed in a 46.6-52.6% band regardless of training size, statistically
indistinguishable from the 49.0% majority-class baseline. The paper's conclusion is not that
it found a model that beats the market - it is that neither model family found a stable
signal that breaks market efficiency using daily factor-lag features alone. What does survive
is a practical takeaway: gradient boosting is the far safer default when training data is
extremely scarce.

The regime detection paper transplants the exact same discipline used in industrial wireless
CFAR onto market-regime alerting. On a synthetic Markov-switching volatility process, a naive
threshold set at the 90th percentile of a sample contaminated by crisis-period extremes aimed
for a 10% false-alarm rate but realized only 4.53% - a 5.47 percentage-point (about 54.7%)
miss. A CFAR approach, computing its threshold from the calm-regime-only null distribution,
hit its targets precisely at all three levels tested - 1.02%, 5.02%, and 10.02% against
targets of 1%, 5%, and 10% - with errors of about 0.02 percentage points. The same experiment
measured the trade-off: raising the target false-alarm rate from 1% to 10% cut average
detection delay from 18.46 to 4.86 steps and cut the miss rate from 40.9% to 0%. The paper
states plainly that this experiment used the true regime label to compute the CFAR threshold,
an upper-bound measurement, and used no real market data at all.

## 4. Application Map and Maturity Ladder

The decision-map paper that cuts across all six clusters directly tackles the pattern the
other 18 papers show piecemeal: when does a classical method win, and when does deep learning
win. On modulation classification (RadioML, SNR 6dB), the classical method beat deep learning
85.5% to 68.1%. On fixed-false-alarm-rate interference detection, the classical method held
its false-alarm rate steady as conditions drifted while deep learning's exploded to 1.0. The
opposite held for signal separation, where deep learning (a Conv-TasNet variant) improved
signal-to-distortion ratio by +3.01dB while the classical method (ICA) made things worse than
doing nothing at -14.25dB, and for RF fingerprint fusion at K=50, where deep learning's AUROC
of 0.9994 beat the classical method's 0.945. The winner changes by task, and this paper
publishes that fact as a task-by-task decision map instead of selling a single algorithm.

Building on this map, 2i classifies how the judgment logic behind these six industry clusters
extends into smart buildings, energy, logistics, and telecom spectrum management, using four
honest tiers: demonstrated (already measured), extension (a natural next step requiring
re-validation), research (a method exists but is unvalidated), and concept (an idea stage).
Any method that depends solely on synthetic data is marked research or concept, and is never
promoted to extension or demonstrated before it is validated on real data.

This four-tier ladder is not decorative optimism - it is the actual boundary line used in
sales conversations. Demonstrated means a paid pilot or a client-data re-validation PoC can
start today. Extension means the same judgment logic is likely to transfer to a different
signal type, but no numbers are promised until that domain's real data has been re-measured.
Research and concept mean a method or idea exists without a sellable performance figure yet.
Never promoting a synthetic-only result to extension or demonstrated is the single most
important rule of this ladder.

Placing the same CFAR discipline's results from industrial wireless and market-regime
detection side by side shows how consistently this discipline holds up as it crosses domains.

```chart
{"kind":"bar","title":"Fixed false-alarm-rate discipline: error against target (percentage points)",
 "labels":["Finance naive (90th pctile)","Finance CFAR (target 10)","Industrial CA-CFAR (target 5)"],
 "ylabel":"Error vs. target (pp)",
 "values":[5.47, 0.02, 0.29]}
```

The naive threshold's error (5.47 percentage points) is more than an order of magnitude
larger than the error under CFAR discipline in either domain (0.02 and 0.29 points). The
precision of the discipline itself carries over almost unchanged as the domain shifts from
finance to industrial wireless - which is exactly the evidence behind this white paper's claim
that industry expansion is not the thesis, measurement discipline is.

| Extension area | Supporting papers | Maturity |
|---|---|---|
| Broadcast/music content-ID at operational scale | Audio fingerprinting, sharded index | Demonstrated |
| Occupancy/fall detection commercialization | Device-free WiFi-CSI, cross-environment calibration | Demonstrated (needs a labeling budget) |
| RF fingerprinting for access control | Four open-set verification papers | Research (risk-score stage) |
| Predictive maintenance extension (incl. acoustic) | Vibration/acoustic PdM | Demonstrated (vibration) / research (acoustic) |
| Agent platform tool retrieval | Skill-retrieval routing | Research |
| Smart-building occupancy/energy optimization | WiFi-CSI + industrial CFAR | Extension |
| Telecom/spectrum interference management | Industrial CFAR, RF fingerprint decision map | Extension |
| Logistics/multi-sensor anomaly detection | Calibration, PdM | Extension |
| Market risk alerting systems | Backtest discipline, regime CFAR, factor GBM vs. DL | Research (not investment advice) |

## 5. Honest Boundaries

Thirteen of the 19 papers confirmed their results on real, public data: GTZAN, FMA-small,
UT-HAR, OPERAnet, WiSig, INRIA, WIDEFT, DroneRF, CardRF, CWRU, RadioML2016.10a, and the
Fama-French three-factor dataset. The remaining six - backtest discipline, CFAR regime
detection, large-scale skill retrieval, the RF fingerprint probe-point ablation, industrial
interference detection, and a substantial share of the cross-cutting decision-map paper - are
synthetic-data or methodology work, and each section above named that distinction explicitly.
The reasons for using synthetic data are not hidden either: some experiments need a true
regime label or a true value to measure a method's upper bound at all; some had to disclose a
surrogate metric honestly because pretrained embedding models could not be downloaded in the
network environment where the work ran; and some simply had not yet secured real microphone
recordings.

Data licenses are not uniform either. WiSig is CC-BY-NC-SA, limited to non-commercial research
use, while INRIA, DroneRF, OPERAnet, and FMA-small are CC-BY family licenses that permit
commercial use. GTZAN's original license was never confirmed, so the papers that rely on it
used it for local verification only, without redistribution. This same distinction applies
directly to any commercial productization discussion.

The three finance papers - backtest discipline, factor return prediction, and regime
detection - are methodology research, not investment advice. They make no claim about the
real-money profitability of any specific strategy or asset allocation, and should be read only
as case studies of the same measurement discipline this signal-processing white paper
emphasizes, transplanted into a different domain. The two sensing papers likewise restate that
they are research feasibility demos, not clinically certified medical devices. The four
security papers say two things at once: separability is real, and the authentication rate
required for access control is not there yet. What 2i sells is not a finished algorithm per
industry - it is the discipline of drawing that boundary honestly and measuring inside it.

This sense of boundary applies to every future paper as well. When a new paper secures real
validation data, its maturity label in this document moves up; if a reproduction attempt turns
up a problem, the label moves down or the result is withdrawn. This white paper itself is
rewritten from scratch, on this same five-section frame, every time the paper library changes.

The full text can be downloaded in Korean and English from the PDF buttons below. All 19
source papers are also published as independent pages, and each subsection of Section 3 links
directly to its full PDF.

## References

- Audio content fingerprinting at scale (GTZAN, FMA-small)
- A sharded index for million-song-scale content-ID (GTZAN + synthetic capacity scaling)
- Device-free WiFi-CSI occupancy and fall detection (UT-HAR, OPERAnet)
- WiFi-CSI cross-environment shift and few-shot calibration (UT-HAR)
- Open-set RF fingerprint verification (WiSig, INRIA, WIDEFT)
- A reproducible open-set evaluation protocol
- RF fingerprint probe-point ablation study (synthetic device fleet)
- The open-set reality of drone RF detection (DroneRF, CardRF)
- Classical-feature-based equipment predictive maintenance (CWRU real, acoustic synthetic)
- Fixed-false-alarm-rate industrial anomaly and interference detection (synthetic simulation)
- Edge deployment of signal models: INT8 QAT vs. PTQ (RadioML)
- Edge signal-processing budget attribution (real hardware benchmark)
- When tabular boosting beats deep learning on signal features (RadioML)
- Calibrated confidence risk-scores for signal decisions (DroneRF)
- Large-scale skill-corpus routing: BM25 vs. hybrid search (synthetic tool corpus)
- Backtest discipline: three traps that inflate performance (synthetic time series)
- Factor return prediction: boosting vs. deep learning (real Fama-French data)
- Fixed-false-alarm-rate regime detection (synthetic Markov-switching process)
- Classical DSP + GBM vs. deep learning: a decision map for signal tasks (mixed)
