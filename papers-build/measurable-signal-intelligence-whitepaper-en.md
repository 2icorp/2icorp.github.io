## Summary

This white paper ties together 20 technical papers that 2i has produced. Spanning six
industries - media, sensing, security, industrial equipment, edge and AI infrastructure, and
finance - these papers look nothing alike on the surface. A broadcaster wants to know which
song in the catalog a short audio clip belongs to. A care facility wants to know whether
someone is present in a room, or has fallen. A factory wants to know whether a bearing's
vibration has left its normal range. A retail store or a patrol site wants to know whether a
vision-language model can run fast on-premises without a data-center GPU. An agent platform
wants to know whether search actually surfaces the right tool once the tool count crosses a
thousand. A quant fund wants to know whether a backtest's performance will survive contact with
live trading. These six questions all reduce to the same underlying structure: extract features
from a signal (sound, radio frequency, vibration, image tokens, text query, time-series return),
then decide whether those features have drifted from a normal, enrolled, or known state, or
whether a processing path actually stays inside the budget it promised (accuracy, false-alarm
rate, latency, memory). The face changes by industry; the body does not.

The real thesis running through this white paper is not industry expansion itself, but the
measurement discipline that makes that expansion trustworthy. Five principles repeat across
domains in different clothing: pre-registering what is being measured before the experiment
runs, running shuffled control comparisons alongside real signals, comparing performance at a
fixed target false-alarm rate rather than accuracy alone, blocking data leakage across time or
partition boundaries, and publishing negative results as readily as positive ones. The fact that
a constant-false-alarm-rate (CFAR) discipline radar engineers built half a century ago hits its
target within about 0.1 percentage points when transplanted into both industrial wireless
interference detection and financial market-regime alerting, the fact that measurement
overturned the assumption that hybrid retrieval always wins, and the sharpest new data point in
this update - the same 4-bit precision can differ 190x in decode speed depending on which
compute kernel handles it - are evidence that this discipline is not just rhetoric.

The headline of this v4 update is that the edge vision-language model (VLM) quantization study
reached closure. Working on `microsoft/Mage-VL`, an Apache-2.0-licensed 4B-class streaming VLM,
measured on consumer Apple silicon (M4 Pro, 48GB unified memory), the prior round of measurement
left an unresolved, counterintuitive result: quantization shrank memory but slowed decoding, and
the runtime was only a suspected cause. This update closed that loop with a direct measurement.
Moving the same language backbone to a fused-kernel runtime lifted decode speed from 0.47 tok/s
to 89.67 tok/s, roughly 190x. Memory and speed are separate axes, and getting both at once
requires not just a low-bit precision but a runtime with a kernel that computes that precision
directly - this is the most concrete demonstration, on a new stage (edge deployment), of the
measurement discipline this white paper repeats throughout.

The 20 papers are not uniformly mature, and this white paper does not hide that. Fourteen
confirmed their results on real, public data or real hardware benchmarks; the rest remain at the
synthetic-data, mixed (real plus synthetic, explicitly labeled), or methodology stage. Negative
results, the places where conventional wisdom broke, are published as-is: hybrid retrieval
failing to beat a single retriever, open-set RF fingerprint authentication collapsing at the
false-alarm rates access control actually needs, deep learning losing badly to boosting on small
data, and naive quantization running slower, not faster, on edge silicon. The three finance
papers are methodology research and not investment advice.

## 1. Why Measurement Discipline: One Logic, Six Industry Faces

Companies selling AI transformation usually build a different story for each industry: vision
inspection for manufacturing, content recognition for media, predictive models for finance, "a
smaller model" for edge deployment. That approach is not wrong, but it misses something. Many
problems across different industries ask the same mathematical question wearing a different
surface. "Is this sound the song we know" (audio fingerprinting), "is someone in this room, did
they fall" (WiFi sensing), "did an enrolled device send this signal, or an unknown one" (RF
fingerprinting), "has this bearing's vibration left its normal range" (predictive maintenance),
"does shrinking this model to 4 bits actually make it faster, or just smaller and slower" (edge
quantization), "does search surface the right tool for this request" (agent retrieval), "does
this backtest's return beat chance" (finance) - all of these reduce to the same problem: deciding
whether features extracted from a signal, or a resource-usage profile, have drifted from a
normal, enrolled, known, or promised state. Anomaly detection, open-set identification, and
resource-budget verification are one judgment logic wearing different faces.

What 2i has confirmed repeatedly across 20 papers is not this judgment logic itself, but how to
measure whether it is working honestly. Five principles summarize it. First, pre-register what
is being measured and what counts as success before the experiment runs. Second, run real
signals alongside randomly shuffled controls to separate chance from skill. Third, compare
performance at a fixed target false-alarm rate or a fixed target throughput, not accuracy alone.
Fourth, block the paths by which training, calibration, and evaluation data leak across time or
partition boundaries. Fifth, publish results that contradict expectations or hurt the story, as
readily as favorable ones. The papers in this library prove why each principle matters. A WiFi-CSI
benchmark's own official split turning out to be a leakage artifact demonstrates the fourth. The
same RF fingerprint model's AUROC swinging from 0.9994 to 0.2235 purely by changing the evaluation
protocol demonstrates the third. A single look-ahead bug inflating backtest performance 21-fold
demonstrates the first. And the same 4-bit precision differing 190x in speed by runtime alone
demonstrates the fifth principle newly reconfirmed this round: publish the uncomfortable result
first, and keep chasing the cause.

## 2. The Gauge Method: From Measurement to Handoff

2i splits every project into three gates. The measurement gate checks, at the lowest possible
cost, whether a method captures a statistically meaningful signal or holds to a promised resource
budget, using public data, synthetic data, or a single piece of real consumer hardware. The
validation gate re-verifies that method against a client's real data, real false-alarm targets,
and real hardware budget. The handoff gate places a validated method into an operating pipeline
and monitors it continuously. Each gate must earn the cost of the next one; a method that fails
the measurement gate is not pushed into validation.

The edge VLM quantization paper is a clean example of how this gauge method generates its own
next step. The earlier measurement, an honest negative result in which quantization shrank memory
but slowed decoding, was itself a measurement-gate outcome. Publishing it rather than hiding it
set up the next measurement gate's question automatically: if the runtime, not the precision, is
the cause, does computing the same precision through a fused kernel actually get faster? This
update is exactly that second measurement gate. Because the answer came back as a 190x
improvement, the business case for the next step - porting the custom `mage_vl` architecture into
an MLX vision-language framework - is now backed by a concrete number. The measurement gate
earned the cost of the validation gate.

Most of the 20 papers in this library have cleared the measurement gate, and a subset has already
been re-verified on real data. Audio content fingerprinting, device-free WiFi sensing, vibration
predictive maintenance, RadioML-based edge optimization, and now the closed-loop edge VLM
quantization study are all close to the validation stage on public real data or real consumer
hardware. Backtest discipline, regime-detection CFAR, agent retrieval, and the RF fingerprint
probe-point ablation study remain at the measurement-gate stage - synthetic data has confirmed
that the methodology is meaningful, nothing more. Hiding this distinction would mean selling
validated results and untested ideas with the same confidence. 2i does not sell that way.

The gates exist because of cost. A measurement gate finishes in a day to a few days on a public
dataset, locally generated synthetic data, or a single developer's laptop. A validation gate
takes days to weeks because it requires a client's real signal or real deployment hardware. A
handoff gate is an ongoing cost of continuous monitoring in production. Pushing a method into
validation when it cannot be statistically distinguished from its shuffled control, or when it
cannot hold its promised resource budget, wastes a client's time and money. So 2i's gauge method
asks, at every gate, "is there evidence to move to the next stage," and stops on the spot when
there is not.

## 3. The Paper Library: 20 Papers, Six Industries

19 of the 20 papers fall cleanly into the six industry clusters below. The remaining one, a
decision-map paper pitting classical DSP-plus-boosting against deep learning across six signal
tasks, cuts across all of them and speaks directly to Section 4's usage-map question - when
classical methods win and when deep learning wins - so it is treated separately there.

```chart
{"kind":"bar","title":"Share of papers at the validation stage, by industry (of 19; original count in parentheses)",
 "labels":["Media(2/2)","Sensing(2/2)","Security(3/4)","Industrial(1/2)","EdgeAI(5/6)","Finance(1/3)"],
 "ylabel":"Validation share",
 "values":[100.0, 100.0, 75.0, 50.0, 83.3, 33.3]}
```

Media and sensing confirmed both of their papers on real, public data. Security confirmed three
of four; only the probe-point ablation study used a synthetic device fleet. Edge and AI
infrastructure confirmed five of six, and the newly closed edge VLM quantization paper is what
lifted that share this round. Finance confirmed only one of three (factor return prediction); the
other two (backtest discipline, regime detection) are methodology experiments, and this ratio
shows that plainly.

### 3.1 Media and Content ID

Two papers scaled audio fingerprinting under real measurement. The first confirmed, on 999 GTZAN
tracks, a top-1 accuracy of 95.0% for clean 10-second clips, 72.5% even under heavy noise (SNR
-5dB), and 96.7% under MP3 compression from 128 to 32 kbps. A naive matcher with no temporal
alignment collapsed from 87.5% clean to 2.0% at SNR 0dB under the same conditions. Scaling the
catalog 16x, from 500 to 7,996 clips on FMA-small, barely moved clean accuracy (99.5% to 99.0%),
while the naive baseline collapsed from 37.5% to 17.0%. The real bottleneck this measurement
exposed was not accuracy but memory: roughly 0.889MB per track, which extrapolates to about 868GB
for a single in-memory dictionary at 1 million songs.

The second paper confronts that memory bottleneck head-on. Sharding the same hash table by hash
key preserves accuracy exactly as shard count rises from 1 to 32 (140 of 150 queries correct,
unchanged across the full 32x range). But the paper does not hide that sharding does not fully
solve the problem. A fixed per-process overhead (about 180MB) is duplicated once per shard, so at
1-million-song scale with 6,000-track shard capacity the fleet's total memory is 1.18x the
monolithic estimate; shrinking capacity to 1,000 tracks per shard pushes that to 2.17x. And even
at 32 shards, a single query still touches 99.98% of shards. Routing shrinks how much data each
shard holds, not how many shards a query has to touch.

### 3.2 Sensing and WiFi-CSI

Device-free WiFi-CSI, on real UT-HAR and OPERAnet data, achieved 95.2% accuracy on 7-way activity
classification (macro F1 92.7%), 0.990 AUROC on fall detection (97.6% precision, 91.1% recall at
threshold 0.5), and 1.000 AUROC on occupancy detection. The study itself states it is a research
demo of technical feasibility, not a clinically certified medical device.

The cross-environment calibration paper exposes the other side of that result. Measured on
UT-HAR's official train/val/test split, accuracy barely drops (94.7-94.9% versus 95.2% in-split),
which the paper attributes to leakage from overlapping sliding windows, then reconstructs a
verifiable domain split and remeasures a real domain shift that collapses accuracy to 55.08%,
37.29 percentage points below the same-domain ceiling of 92.37%. Adding just 50 labels per class
(350 total, 9.7% of the source training set) recovers 80% of that gap, lifting accuracy to 84.92%.
The team that measured on the official split saw the same calibration recover only -4.4% to +0.6%
- because there was no real gap to recover in the first place.

### 3.3 Security and RF Fingerprinting

Four papers show this white paper's most honest boundary. Open-set RF fingerprint verification
confirmed that separability is real: K=1 AUROC ranges from 0.52 (WIDEFT, near chance) to 0.87
(INRIA) across datasets, but collapses at the low false-alarm rates access control actually
requires. On INRIA, TAR@FAR=1% is 20.8%, but TAR@FAR=0.1% drops to 2.9%, and under WiSig's
cross-receiver condition TAR@FAR=0.1% falls to 0.5%. Fusing 10 packets (K=10) lifts INRIA's
TAR@FAR=1% to 91.4%, but tightening to FAR=0.1% drops it back to 61.6%.

The reproducible open-set evaluation protocol paper explains why these numbers scatter this
widely. The same embedding, the same model, can post an AUROC of 0.9994 under a post-hoc-optimal
combination and 0.2235 under a strict protocol that fully separates enrolled and evaluation
devices and assumes a worst-case unenrolled-identity attacker. A closed-set classification
accuracy of an impressive-looking 82.0% turns out to pair with a TAR@FAR=0.1% of just 2.9% on the
same data. The authors put it plainly: this measures "the protocol's leniency, not the model's
capability." The probe-point ablation study dug into where in the receive chain the fingerprint
lives and dies. Equal error rate (EER, lower is better) was lowest, 0.307, at the raw IQ stage, but
climbed to 0.489 and 0.499, near chance, as the signal passed through standard processing that
improves communication performance (frequency-offset correction, matched filtering,
synchronization). Drone open-set detection showed classical methods rejecting unknowns 5.7x more
often than deep learning at low fusion counts (K=1, 0.424 versus 0.074), though deep learning
edges ahead once fusion exceeds K=20 (0.875 versus 0.917). 2i combines these four papers'
conclusions to redefine RF fingerprinting as a risk-score layer, not a single pass/fail gate.
These four papers also draw on public data with uneven licenses: WiSig is CC-BY-NC-SA
(non-commercial, research only), while INRIA is CC-BY 4.0 (commercial use permitted), so any
commercial re-validation must lean on the latter family.

### 3.4 Industrial Equipment

The vibration-and-acoustic predictive maintenance paper labels vibration data (the CWRU standard
bearing-fault dataset) as real and acoustic data as procedurally synthesized, marking every result
accordingly. On the real vibration axis, physics-informed features and a simple baseline tied at
1.000 under clean conditions, but diverged 3.4x under heavy noise (SNR -5dB: 0.636 versus 0.186).
The synthetic acoustic axis showed the same pattern (0.903 versus 0.312 clean, 0.492 versus 0.302
at -5dB), but the paper states outright that "the largest and hardest-to-hide limitation is that
the acoustic results are entirely synthetic," and flags validation against a real industrial-noise
dataset (MIMII, CC-BY-4.0) as the next step.

The industrial wireless interference detection paper transplants radar's CFAR discipline
directly: against a 5% target false-alarm rate, CA-CFAR realized 5.29%, with an overall detection
rate (Pd) of 0.980 and slice-localization accuracy of 0.982 against a random baseline of 16.7%.
But the paper leaves its honest limits in place. The jamming signal, the strongest by total
transmit power, had the lowest detection rate (0.929) due to masking, and spatial localization
error, 4.98m versus an 18.49m centroid baseline (a 3.7x improvement) with no shadowing, degraded
non-monotonically to 18.47m at 12dB shadowing, essentially matching the 18.11m baseline. Every
number in this paper comes from physics-based synthetic simulation, not real radio hardware, as
the paper states.

### 3.5 Edge and AI Infrastructure

Six papers answer operational questions with real measurement. The most recently closed, and this
v4 update's headline case, is the streaming VLM quantization study on edge silicon. Its subject is
`microsoft/Mage-VL`, an Apache-2.0-licensed 4B-class streaming vision-language model (a Mage-ViT
vision encoder plus a `Qwen3-4B` language backbone, 4.742 billion parameters total), measured not
on a data-center GPU but on a single consumer Apple M4 Pro (48GB unified memory). The prior round
measured three precisions through a `transformers` plus Metal (MPS) stack: bf16 (9.49GB, 13.01
tok/s), INT8 (5.86GB, 2.31 tok/s), and INT4 (4.15GB, 0.47 tok/s). Memory fell exactly as expected
(-38% at INT8, -56% at INT4 relative to bf16), but decode speed moved the opposite direction,
slower at lower precision. The suspected cause was not the hardware but the kernel:
`optimum-quanto`'s weight-only quantization stores weights at low bit-width but dequantizes them
back to bf16 before every matmul, and Apple Metal has no fused kernel that computes the low-bit
representation directly, so the dequantization cost is billed repeatedly, once per decoded token.

This update closed that loop with direct measurement. Running the same language backbone
(`Qwen3-4B-Instruct-2507`, the component that dominates Mage-VL's decode speed) through
`mlx-lm`'s fused-kernel INT4 path on the same Apple M4 Pro produced 89.67 tok/s decode, 71.06
tok/s prompt processing, and 2.46GB peak memory. Set beside quanto INT4's 0.47 tok/s at the same 4-bit
precision, the ratio is about 190.8x. Memory was smaller too, in absolute terms. The axes were
never misaligned; the wrong runtime was simply converting one axis's gain (memory savings) into
another axis's debt (decode latency), and choosing a runtime that computes the low-bit
representation directly stops that conversion from happening at all. Neither "lower precision is
always faster" nor "lower precision can be slower" was the complete answer; the real conclusion is
that memory and speed are separate axes, and getting both requires validating precision choice and
runtime choice independently.

```chart
{"kind":"bar","title":"Edge VLM decode speed: same INT4, runtime changed only (tok/s)",
 "labels":["quanto INT4 (dequant path)","mlx-lm INT4 (fused-kernel path)"],
 "ylabel":"Decode tok/s",
 "values":[0.47, 89.67]}
```

Three boundaries need to be stated honestly. First, 89.67 tok/s is measured on the language
backbone in isolation, not on all of Mage-VL. Because the decode loop only repeats through the
language-model layers (the vision encoder participates once, during prefill), this isolated
measurement correctly identifies what dominates full-VLM decode speed, but Mage-ViT and the
StreamMind event gate have not yet been shown to run end-to-end in MLX at this speed. The custom
`mage_vl` architecture is not registered in `mlx-vlm` mainline, so loading a community-built
Mage-VL INT4 checkpoint directly through `mlx-vlm` again failed ("Model type mage_vl not
supported"). Second, the memory comparison is not a clean apples-to-apples match either: quanto
INT4's 4.15GB includes the vision encoder, while MLX's 2.46GB is the language backbone alone.
Third, the fast path for streaming video (the DCVC-RT neural codec) remains CUDA-bound and is out
of scope for this measurement. Strip these boundaries away and what remains is a concrete,
testable next step: porting `mage_vl` into `mlx-vlm` (or an equivalent MLX vision-language
framework) to re-measure the full pipeline, vision encoder included, on the same runtime.

The remaining five papers repeat this lesson - that a resource budget splits into separate axes
of precision, size, and latency, and each must be measured on its own terms - from different
angles. The INT8 quantization paper confirmed that a RadioML modulation-classification model's
93.18% FP32 accuracy drops to 61.91% (-31.27 percentage points) under static PTQ
(calibration-only), but quantization-aware training (15 epochs of fine-tuning) recovers to
91.45% (-1.73 percentage points), clawing back 94.5% of the PTQ loss. Both paths shrink model size
by 70.3%, and QAT is marginally faster too (0.155ms versus 0.158ms p50). The edge budget
attribution paper proved, stage by stage, that a spec promising 40 MSPS on a single Apple M3 Pro
core realizes only 0.19x (7.59 MSPS) even on a quiet machine, dropping to 0.09x (3.5 MSPS) under
load. The top three stages account for 85.28% of the budget, and code optimization alone reaches
at most 33.1% of the target spec (assuming four cores run concurrently).

The tabular boosting versus deep learning paper reconfirmed that, on 539 samples, LightGBM beats
raw-IQ deep learning by 17.4 percentage points (85.5% versus 68.1%). Scaling to 2,000 samples
narrows that gap from 36.0 to 21.3 percentage points, and the paper is candid that two data points
alone cannot confirm whether the curves actually cross at 5,000 or 9,900 samples. The calibration
paper lowered a detector's confidence error (ECE) from 0.0446 to 0.0188 (-57.9%) via isotonic
regression while preserving discriminative power almost exactly (AUROC 0.9374 to 0.93633).
Confidence bin 0.80-0.87 had an actual accuracy of only 0.6441 before calibration, rising to
0.8986 in the same bin after isotonic calibration.

The sixth paper, large-scale skill-corpus retrieval, directly overturns a common assumption. On a
fully public synthetic corpus of 2,000 tools, pitting pure lexical matching (BM25), morphological
similarity search (character n-gram TF-IDF), and a rank-fusion hybrid (RRF) against each other,
hybrid Recall@1 (0.508) tied BM25 (0.508) and trailed TF-IDF (0.517) slightly. At Recall@5,
hybrid was the worst of the three (0.683) against BM25's 0.742 and TF-IDF's 0.700. The more
important result concerns abstention on queries with no correct answer. Applying a score gate
calibrated so roughly 90% of positive queries pass to 41 hard-negative queries, the correct
abstention rate was 26.8% for BM25, 31.7% for TF-IDF, and just 12.2% for hybrid. The paper
publishes its finding as-is: "hybrid never decisively beat the best single retriever."

### 3.6 Finance

The three finance papers are methodology research, not investment advice. The backtest discipline
paper measured three performance-inflation traps on synthetic time series. A look-ahead bug
collapsed a mean annualized Sharpe of 21.1 (impossible) to 0.069 (noise) simply by lagging the
same strategy one day, and survivorship bias, in a universe where about 20.3% of names delisted
over five years, inflated a survivors-only CAGR by 3.8 percentage points over the full-universe
figure (13.9% versus 10.1%). Without a multiple-testing correction, raising the number of tried
parameter combinations from 5 to 2,000 lifted the best in-sample Sharpe from 0.34 to 0.90 while
out-of-sample Sharpe stayed in the noise range (-0.07 to 0.17) regardless of N, and the naive
significance test's false-positive rate rose from 6.7% to 46.7%. Bonferroni correction and the
Deflated Sharpe Ratio held false positives at 0% across every N.

The factor-return prediction paper is the first in this library to use real market data
(Fama-French three-factor daily returns, 1926-2023, 25,543 trading days). With only 60 days of
training data, a shallow neural network's out-of-sample R² collapsed to -2.60, while gradient
boosting degraded far more gently at -0.07, roughly a 35x gap. As training data grew to 4,000-8,000
days, the neural network (R² -0.09 to -0.08) edged ahead of boosting (-0.13 to -0.10), though both
remained clearly worse than the trivial mean-prediction baseline (about -0.001). Directional
accuracy stayed at 46.6-52.6% regardless of training size, statistically indistinguishable from
the majority-class baseline of 49.0%. The paper's conclusion is not that it found a model that
beats the market; it is that neither model family found a stable signal that breaks market
efficiency using daily factor-lag features alone. The practical takeaway that survives is that
gradient boosting is a much safer default at very small sample sizes.

The regime-detection paper transplants the exact same discipline as this library's industrial
wireless CFAR study into market-regime alerting. In a synthetic Markov-switching volatility
process, a naive threshold set at the 90th percentile of a mixed (calm-plus-crisis) sample,
targeting a 10% false-alarm rate, realized only 4.53%, missing by 5.47 percentage points (about
54.7%). A CFAR threshold computed only from calm-regime statistics hit 1.02%, 5.02%, and 10.02%
against targets of 1%, 5%, and 10%, an error of about 0.02 percentage points across all three. The
paper also measured the trade-off of raising the target false-alarm rate from 1% to 10%: mean
detection delay shrinks from 18.46 to 4.86 steps, and the miss rate falls from 40.9% to 0%. The
paper states plainly that this experiment used the true regime label to compute the CFAR
threshold, an upper-bound experiment, and used no real market data at all.

## 4. Usage Map and Maturity Ladder

The decision-map paper, which cuts across all six industries, addresses head-on the pattern the
remaining 19 papers each showed piecemeal: when do classical methods win, and when does deep
learning win. On modulation classification (RadioML, SNR 6dB), classical methods beat deep
learning 85.5% to 68.1%; on fixed-false-alarm-rate interference detection, classical methods held
their false-alarm rate as conditions shifted while an unconstrained deep-learning detector's
false-alarm rate exploded to 1.0. In the opposite direction, on co-channel signal separation, a
learned separator (a Conv-TasNet variant) posted an SI-SDR improvement of +3.01dB while a
classical method (ICA) scored -14.25dB, worse than doing nothing, and on RF fingerprint fusion
(K=50) deep learning's AUROC of 0.9994 beat the classical baseline's 0.945. The winner changes by
task, and the paper publishes that as a per-task decision map rather than selling a single
algorithm. The lesson the edge VLM quantization paper surfaced - separate precision from runtime
and measure each - reads as an extension of this same decision map: the winner can split not only
by algorithm family but by which layer of the compute stack is under test.

Building on this map, 2i classifies how the judgment logic behind these six industries extends
into smart buildings, energy, logistics, telecom and spectrum management, and on-premises edge AI
packaging, using four honest stages: validated (already measured), extension (a natural extension,
needs re-validation), research (a method exists but is unverified), and concept (an idea stage).
Methods that rely on synthetic data alone are marked research or concept and are never promoted to
extension or validated before real-data confirmation.

This four-stage ladder is not a decorative optimism dial; it is the actual boundary used in sales
conversations. A validated-stage method can start a paid pilot or a client-data re-validation PoC
today. An extension-stage method is likely to transfer to a different signal type, but no numbers
are promised until it is re-measured on that domain's real data. Research and concept stages mean
a methodology or idea exists but no sellable performance number exists yet. Never promoting a
method validated only on synthetic data to extension or validated is this ladder's single most
important rule. This update places the edge VLM quantization paper's language-backbone decode
result at the validated stage, while marking the full pipeline, vision encoder included, still at
the extension stage pending the port.

Placing the same CFAR discipline's results from industrial wireless and market-regime alerting
side by side shows how consistently this measurement discipline holds across domains.

| Extension area | Supporting papers | Maturity |
|---|---|---|
| Broadcast and catalog content-ID operations | Audio fingerprinting, sharded index | Validated |
| Commercializing occupancy and fall detection | Device-free WiFi-CSI, cross-environment calibration | Validated (needs a labeling budget) |
| RF fingerprint authentication for access control | Four open-set verification papers | Research (risk-score stage) |
| Extending predictive maintenance, acoustic included | Vibration and acoustic PdM | Validated (vibration), research (acoustic) |
| On-premises edge VLMs for retail and patrol sites | Edge VLM quantization (new) | Validated (language backbone), extension (full pipeline) |
| Agent-platform tool retrieval | Skill retrieval routing | Research |
| Smart-building occupancy and energy optimization | WiFi-CSI plus industrial CFAR | Extension |
| Telecom and spectrum interference management | Industrial CFAR, RF fingerprint decision map | Extension |
| Logistics and equipment multi-sensor anomaly detection | Calibration, PdM | Extension |
| Market risk-alerting systems | Backtest discipline, regime CFAR, factor GBM-vs-DL | Research (not investment advice) |

## 5. Honest Boundaries

Of the 20 papers, 14 confirmed their results on public real data or real hardware benchmarks
(GTZAN, FMA-small, UT-HAR, OPERAnet, WiSig, INRIA, WIDEFT, DroneRF, CardRF, CWRU,
RadioML2016.10a, Fama-French three-factor data, and real measurement on an Apple M4 Pro and M3
Pro). The remaining six, backtest discipline, regime-detection CFAR, large-scale skill retrieval,
RF fingerprint probe-point ablation, and industrial interference detection, are synthetic-data or
methodology experiments, and the predictive-maintenance and decision-map papers are mixed results
combining real and synthetic measurements; this white paper has labeled that distinction in every
section. The reasons for using synthetic data are stated openly too: needing a true regime label
or a true value to measure a method's ceiling, needing to honestly flag a proxy metric in a
network environment where a pretrained embedding model could not be downloaded, or not yet having
real microphone recordings in hand.

Data and model licenses are not uniform either. WiSig is CC-BY-NC-SA, restricted to non-commercial
and research use, while INRIA, DroneRF, OPERAnet, and FMA-small are CC-BY family licenses that
permit commercial use. GTZAN's original license status has not been confirmed, so the papers that
rely on it use it for local validation only, without redistribution. The newly added edge VLM
quantization paper's subject model, `microsoft/Mage-VL`, carries an Apache-2.0 license, and the
paper itself emphasizes that this makes it a model that can be commercially packaged and deployed,
not merely a research demo. This distinction applies directly to any commercial productization
discussion.

The three finance papers (backtest discipline, factor-return prediction, regime detection) are
methodology research, not investment advice. They make no claim about the live-trading
profitability of any specific strategy or asset allocation, and should be read only as cases where
the measurement discipline this signal-processing white paper emphasizes was transplanted into
another domain. The two sensing papers are, again, research demos of technical feasibility, not
clinically certified medical devices. The four security papers say two things at once: that
separability is real, and that the authentication rate access control needs is not there yet. The
edge VLM quantization paper deals with a commercially deployable model, but its headline figure of
89.67 tok/s must always be cited alongside the boundary that it is a language-backbone-only
measurement, not a measured figure for the full pipeline including the vision encoder. What 2i
sells is not a finished algorithm for each industry, but the discipline of drawing this boundary
itself and measuring honestly within it.

This same sense of boundary will apply to every paper added going forward. When a new paper
secures real validation data, its maturity label is raised; when a replication attempt turns up a
problem, its maturity label is lowered, or the result is withdrawn. This white paper itself will
be rewritten on this same five-section frame every time the paper library changes materially.

Both the Korean and English full texts are available as PDF downloads below. Each of the 20
underlying papers is also published on its own page, and every subsection of Section 3 links
directly to its full PDF.

## References

- Audio content fingerprinting at scale (GTZAN, FMA-small)
- A sharded index for million-song-scale audio content ID (GTZAN plus synthetic capacity extension)
- Device-free WiFi-CSI occupancy and fall detection (UT-HAR, OPERAnet)
- WiFi-CSI cross-environment shift and few-shot calibration (UT-HAR)
- Open-set RF fingerprint verification (WiSig, INRIA, WIDEFT)
- A reproducible open-set evaluation protocol
- RF fingerprint probe-point ablation study (synthetic device fleet)
- The open-set reality of drone RF detection (DroneRF, CardRF)
- Classical-feature predictive maintenance for rotating equipment (CWRU real, acoustic synthetic)
- Fixed-false-alarm-rate industrial anomaly and interference detection (synthetic simulation)
- Classical DSP-plus-GBM versus deep learning: a decision map for signal tasks (RadioML, mixed with DroneRF/CardRF, etc.)
- Where tabular boosting beats deep learning on signal features (RadioML)
- Deploying signal models at the edge: INT8 QAT versus PTQ (RadioML)
- Edge signal-processing budget attribution (real hardware benchmark)
- Calibrated confidence risk scores for signal judgments (DroneRF)
- Large-scale skill-corpus retrieval: BM25 versus hybrid search (synthetic tool corpus)
- Streaming VLM quantization on consumer silicon (microsoft/Mage-VL, measured on Apple M4 Pro)
- Backtest discipline: three traps that inflate performance (synthetic time series)
- Factor-return prediction: boosting versus deep learning (Fama-French, real)
- Fixed-false-alarm-rate regime detection (synthetic Markov-switching process)
