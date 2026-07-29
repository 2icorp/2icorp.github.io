# Classical-Feature Predictive Maintenance: Vibration and Acoustic

## Abstract

We measure whether predictive maintenance (PdM) for rotating equipment (bearings,
pumps, motors) can be solved with classical signal-processing features and gradient
boosting rather than deep learning. For vibration we use real 12kHz accelerometer
measurements from the standard public benchmark (CWRU, Case Western Reserve
University Bearing Data Center). For acoustic sensing we do not yet have real
microphone recordings, so we use procedurally synthesized data instead, and we
flag every acoustic number in this paper as synthetic. Both modalities share the
same method: extract physically-motivated features (envelope spectrum, cepstrum,
wavelet band energy) and classify with LightGBM, compared against a baseline that
uses only simple time-domain statistics. On real vibration data, both approaches
reach 1.000 accuracy on clean signals, but as signal-to-noise ratio (SNR) drops to
-5dB the full feature set holds at 0.636 while the simple baseline collapses to
0.186. The synthetic acoustic experiment reproduces the same qualitative pattern:
5-class fault accuracy for the full feature set (133 features) is 0.903 clean and
0.492 at -5dB, versus an RMS-only baseline at 0.312 clean and 0.302 at -5dB, i.e.
the baseline never had usable signal to begin with. Separately, we validate a
fixed-false-alarm-rate anomaly detector (CA-CFAR, cell-averaging constant-false-
alarm-rate) on a synthetic wireless-interference benchmark, holding a 5% target
false-alarm rate to a measured 5.29% while achieving 98.0% detection probability
at that operating point. The paper's central claim is not the accuracy figures
themselves but why physics-grounded classical features degrade more gracefully
under noise, and why that matters for real deployments. All acoustic results are
explicitly labeled synthetic; validation against the real industrial-acoustic
public dataset MIMII is the mandatory next step.

## 1. Background

Predictive maintenance for rotating equipment is one of the oldest applications
of industrial AI, and also one of the most frequently oversold. Early-stage faults
in bearings and gears leave physically specific signatures in vibration and sound.
A bearing's outer race, inner race, and balls each have geometrically computable
characteristic frequencies (BPFO, BPFI, BSF, FTF), and a localized defect produces
a periodic impact at that frequency on every revolution. This physics has been
codified over four decades of rotating-machinery diagnostics literature. The
envelope-spectrum analysis method described by Randall and Antoni remains the
industry-standard technique bearing manufacturers use in the field today.

Given that, why classical methods rather than deep learning? This is not a
representation-learning problem, it is closer to a feature-engineering problem
where the relevant signal patterns are already physically well understood. Three
practical reasons follow.

First, interpretability. Field engineers and maintenance managers need to be able
to answer "why did the model flag this as anomalous." An explanation that the
energy in the outer-race defect-frequency band of the envelope spectrum spiked is
immediately understandable and verifiable. A deep-learning embedding's decision
is far harder to explain in those terms.

Second, cost. Gradient-boosted models such as LightGBM train and infer in tens of
seconds on CPU. No GPU and no large labeled training corpus are required. In
industrial deployments that must scale per machine and per sensor, this cost
difference determines whether a project is feasible at all.

Third, edge deployability. Feature extraction plus tree-ensemble inference runs
in real time on low-power edge devices. Deep-learning approaches tend to be
heavier and typically require additional work such as quantization or pruning
to run reliably at the edge.

This paper does not rest that argument on prose alone. We run the pipeline
end to end and report the resulting numbers, and we are explicit about which
numbers are measured on real hardware and which are synthetic.

## 2. Method

### 2.1 Feature pipeline for vibration and acoustic signals

Both modalities share the same design philosophy: extract physically meaningful
features from the raw waveform and feed them into a lightweight tree ensemble.

**Envelope spectrum.** We compute the Hilbert envelope of the signal, take its
FFT, and read off the energy ratio in the bands around the bearing defect
frequencies (BPFO/BPFI/BSF/FTF). These bands are computed from each signal's
measured rotational speed (RPM) and the bearing's geometric constants (ball
count, contact angle, pitch-diameter ratio). This is the core feature for
vibration- and acoustic-based PdM: it directly captures the periodic amplitude
modulation a localized defect produces on every revolution.

**Cepstrum.** We take the first several non-DC coefficients of the real
cepstrum. The cepstrum, the inverse Fourier transform of the log spectrum,
compresses regularly repeating harmonic structure (gear mesh, rotational
periodicity) into a compact representation.

**Wavelet band energy.** A 4-level Daubechies (db4) wavelet decomposition gives
the energy fraction in each band (approximation A4, details D4/D3/D2/D1).
Wavelets are well suited to transient, impact-like defect signatures that
require time-frequency localization.

**Acoustic-specific features.** Because the acoustic modality is an airborne
microphone signal, we add complementary features: log-mel band energies, MFCCs
(mel-frequency cepstral coefficients), and spectral-shape descriptors (centroid,
rolloff, flatness, kurtosis). STFT, mel filterbank, and MFCC are implemented
directly in NumPy/SciPy without an audio-specific dependency.

**Time-domain statistics.** Traditional vibration-monitoring indicators (RMS,
standard deviation, kurtosis, skewness, crest factor, peak-to-peak) are also
included. For comparison we construct a deliberately minimal baseline that uses
only these time-domain statistics, to isolate how much the physics-grounded
features actually add.

The model is **LightGBM** (`n_estimators=200, max_depth=5`) for supervised
classification, and **IsolationForest**, trained on healthy data only, for
unsupervised anomaly detection. Both train in tens of seconds on CPU.

### 2.2 Fixed-false-alarm-rate anomaly detection: CA-CFAR

In industrial signal monitoring, a bare detection-rate number is meaningless on
its own: anyone can raise detection rate by lowering a threshold, and the cost is
false alarms. An alarm system with frequent false positives gets turned off in
the field. The only honest way to report detection performance is to fix the
false-alarm rate first and report detection rate at that operating point.

We apply the standard radar-signal-processing technique **cell-averaging CFAR
(CA-CFAR, constant-false-alarm-rate)**. CA-CFAR estimates the local noise floor
from reference cells around the cell under test and sets a threshold relative
to that estimate. The threshold is calibrated on an interference-free training
segment to hit a target false-alarm probability (Pfa), then applied unchanged to
the test segment, with no post-hoc adjustment. This calibrate-on-the-null,
do-not-peek-at-labels discipline is what distinguishes CFAR from ad hoc
thresholding.

## 3. Data and setup

### 3.1 Vibration dataset - real (CWRU)

We use the public bearing-fault dataset from the Case Western Reserve University
Bearing Data Center, the standard academic benchmark for bearing-fault vibration
research.

- Sensor: drive-end accelerometer, 6205-2RS JEM SKF deep-groove ball bearing,
  12kHz sampling rate.
- 4 classes (normal, inner-race fault, ball fault, outer-race fault, all
  single-point 0.007in EDM faults) times 4 load/RPM conditions = 16 raw files.
- Loads of 0/1/2/3 hp correspond to nominal RPM 1797/1772/1750/1730.
- Two documented dataset quirks are handled explicitly: one file (98) ships
  without an RPM field, for which we fall back to the nominal RPM; each file's
  signal and RPM variable are selected by exact key match
  (`X0{id}_DE_time`/`X0{id}RPM`) so that a co-bundled struct from an adjacent
  file cannot leak into the wrong signal.
- **Leakage-free split**: training and test are split by load condition, not by
  window. Training uses 0/1/2hp (12 files); the test set is 3hp (4 files), a
  load never seen during training. This avoids the common benchmarking error
  of randomly splitting windows drawn from one continuous recording, which
  places near-identical adjacent windows in both splits.
- We build 1,537 non-overlapping 2048-sample windows (about 171ms), 1,122 for
  training and 415 for test.

### 3.2 Acoustic dataset - synthetic, not measured (MIMII is the next step)

**No real microphone recording was downloaded or used anywhere in this
experiment.** Every clip is a procedural synthesis of rotating-machinery
acoustics.

- Shaft rotation fundamental frequency (25 to 60Hz, RPM 1500 to 3600) plus
  2nd to 4th harmonics.
- A gear-mesh tone whose tooth count is randomized between 20 and 40 per
  sample.
- Bearing defect orders (BPFO/BPFI/BSF) computed from a standard 9-ball
  deep-groove bearing geometry, the same geometry family as the CWRU 6205
  test bearing (only the textbook geometry formula is reused, no CWRU data or
  recordings are involved).
- Fault signatures are implemented as amplitude-modulation (AM) sidebands on a
  structural-resonance carrier: an outer-race fault modulates at BPFO; an
  inner-race fault double-modulates at BPFI and at 1x, the documented
  load-zone signature that distinguishes inner- from outer-race defects; gear
  wear sidebands the gear-mesh tone at 1x; imbalance simply boosts the 1x/2x
  fundamental amplitude with no sidebands at all. These are standard,
  documented distinguishing signatures from the rotating-machinery diagnostics
  literature, not arbitrarily assigned per-class noise.
- Ambient background is broadband Gaussian noise plus a randomized HVAC/fan
  tonal hum.
- RPM, load, microphone distance (with distance-dependent attenuation and
  low-pass filtering), and SNR are all randomized per sample.

We construct 5 classes (normal, bearing outer-race fault, bearing inner-race
fault, gear wear, imbalance) with 300 clips per class for the main 70/30
stratified train/test split (1,500 clips total), plus two additional held-out
sets of 100 clips per class at fixed SNR for the noise-robustness stress test.

**Honest real-data follow-up plan**: MIMII (Purohit et al., real
factory-recorded fan/pump/slider/valve sounds with anomaly labels, CC-BY-4.0,
zenodo.org/record/3384388) or DCASE Task2 (Malfunctioning Industrial Machine
Investigation and Inspection) is the natural next step to validate this
feature-plus-GBM pipeline against actual microphone recordings. This experiment
demonstrates that the pipeline is sound and physically motivated; it does not
claim to have measured a real machine.

### 3.3 Fixed-false-alarm-rate benchmark - synthetic, separate domain

The CA-CFAR fixed-false-alarm-rate detector was validated on a separate
synthetic wireless-interference benchmark rather than on rotating-equipment
data. This is intended to demonstrate that the methodology (threshold inversion
against reference-cell statistics) is a general technique applicable to signal
monitoring broadly, and it should be read as independent of, not part of, the
vibration and acoustic predictive-maintenance results in this paper. Four
interference types (broadband noise, partial-band jamming, single-tone,
carrier-frequency-offset) were synthesized from physical models across 4,000
trials and 6 slices (24,000 windows), with the threshold calibrated on the
interference-free training segment at a 5% target false-alarm rate and applied
unchanged to the test segment.

## 4. Results

### 4.1 Vibration (CWRU, real data): no difference on clean data

On the held-out load (3hp) test set, 4-class fault classification accuracy for
both the full feature set (35 features) and the simple baseline (4 features:
RMS, standard deviation, kurtosis, crest factor) reached **1.000**. Unsupervised
anomaly detection (IsolationForest trained on healthy data only) also reached
near-ceiling AUROC for both: 1.000 for the full feature set, 0.998 for the
simple baseline. CWRU's single-severity (0.007in) fault classification is
already known in the literature as an easy benchmark, and this result confirms
that. A perfect score on clean data is therefore not, by itself, a meaningful
differentiator.

The honest question is: which feature set actually earns its complexity?

### 4.2 Vibration (CWRU, real data): noise is where it matters

Using the clean-trained, fixed models, we corrupt held-out-load test windows
with white Gaussian noise at decreasing SNR, re-extract features from the noisy
signal, and re-evaluate with the same fixed model and scaler.

| SNR (dB) | Full features (35) accuracy | Simple baseline (4) accuracy |
|---|---|---|
| 20 | 0.990 | **1.000** |
| 10 | 0.855 | **1.000** |
| 5 | 0.855 | 0.867 |
| 0 | **0.851** | 0.520 |
| -5 | **0.636** | 0.186 |

```chart
{"kind":"line","title":"Noise-robustness curve, vibration, real CWRU data","labels":["20dB","10dB","5dB","0dB","-5dB"],"series":[{"name":"Full features (35)","values":[99.0,85.5,85.5,85.1,63.6]},{"name":"Simple baseline (4)","values":[100.0,100.0,86.7,52.0,18.6]}],"note":"Vibration, real CWRU measurement"}
```

This table is the actual finding of this paper. At high SNR, the 4-feature
baseline is actually slightly better, since its decision surface is simpler and
has less to overfit. But below 5dB SNR it collapses: 0.520 at 0dB and 0.186 at
-5dB, near the 4-class chance level (0.25). The full 35-feature set degrades far
more gracefully, at 0.851 at 0dB and 0.636 at -5dB.

The reason is clear. Envelope-spectrum and cepstral features capture the
defect's periodic, narrowband signature, which survives broadband additive
noise far better than raw time-domain statistics such as crest factor or
kurtosis, which are perturbed directly and strongly by every added noise sample.
This matches exactly why the rotating-machinery diagnostics literature has
championed envelope analysis for decades, and it is the actual point at which
classical feature engineering earns its value for predictive maintenance: not
accuracy on a clean laboratory dataset, but **robustness under realistic field
noise**.

### 4.3 Acoustic (synthetic): the same pattern, different data

The same qualitative pattern reproduces in the synthetic acoustic data, averaged
across 5 seeds (mean plus or minus standard deviation).

**5-class fault classification.**

| Feature set | Test accuracy | Macro-F1 |
|---|---|---|
| Full features (133) | **0.790 +/- 0.014** | 0.788 +/- 0.014 |
| RMS-only baseline (1) | 0.333 +/- 0.017 | n/a |

Chance level for 5 balanced classes is 0.20. The full feature set clears it by
four times; the RMS-only baseline barely clears it. RMS conflates fault-driven
amplitude changes with the randomized load/distance/SNR nuisance variables, so
it mostly separates loud from quiet rather than fault type.

**Unsupervised anomaly detection.** AUROC for IsolationForest trained on normal
data only was **0.645 +/- 0.022**, clearly above chance (0.5) but well below the
near-ceiling AUROC reached on the vibration/CWRU data. This is expected: the
synthetic acoustic faults are deliberately subtler, AM sidebands buried in a
shared broadband ambient floor, than the CWRU accelerometer's clean, high-SNR
contact signal. This is an honest, non-saturated number, not a cherry-picked
one.

**Noise robustness.**

| Condition | Full features (133) accuracy | RMS-only baseline accuracy |
|---|---|---|
| Clean (SNR 25dB) | **0.903 +/- 0.015** | 0.312 +/- 0.020 |
| Low SNR (-5dB) | **0.492 +/- 0.016** | 0.302 +/- 0.012 |

```chart
{"kind":"bar","title":"Acoustic (synthetic) feature-set performance, clean vs low SNR","labels":["Clean (25dB)","Low SNR (-5dB)"],"series":[{"name":"Full features (133)","values":[90.3,49.2]},{"name":"RMS-only baseline","values":[31.2,30.2]}],"note":"Acoustic, synthetic data, mean of 5 seeds"}
```

The gap is the point. At clean SNR, the full feature set is nearly three times
the baseline (0.90 versus 0.31). The RMS-only baseline stays flat near chance
level almost regardless of SNR, because it never had usable signal to begin
with: a single loudness scalar cannot separate five acoustically distinct fault
mechanisms once RPM, load, and distance are also randomized. The full feature
set's accuracy roughly halves under -5dB SNR (0.90 to 0.49) as the mel/MFCC/
spectral bands are swamped by the ambient floor and the envelope/cepstral
defect peaks lose SNR, a physically sensible degradation curve rather than a
cliff or a floor artifact.

### 4.4 Real versus synthetic, side by side and clearly labeled

The most important figure in this paper is not an accuracy number but the
explicit separation of which numbers are measured and which are synthetic.

```chart
{"kind":"bar","title":"Clean vs low-SNR performance, vibration (real) vs acoustic (synthetic)","labels":["Vibration clean (real)","Vibration -5dB (real)","Acoustic clean (synthetic)","Acoustic -5dB (synthetic)"],"values":[100.0,63.6,90.3,49.2],"note":"Left two bars = real CWRU vibration; right two bars = synthetic acoustic (MIMII validation pending)"}
```

The same qualitative pattern, roughly half the accuracy surviving under noise
for the physics-grounded feature set, reproduces across both modalities. But
reproducing the pattern does not make the acoustic numbers real. The vibration
figures come from an actual accelerometer measuring signals produced by real
steel and real balls. The acoustic figures come from a waveform generated by a
physics equation. Both tell the same methodological story, but they do not
carry the same evidentiary weight.

### 4.5 Fixed-false-alarm-rate anomaly detection (CA-CFAR, separate synthetic domain)

We calibrated the CA-CFAR detector's threshold at a 5% target false-alarm rate
on the interference-free training segment and applied it unchanged to the test
segment. The measured false-alarm rate on interference-free test windows was
**5.29%**, close to the target. At this operating point, overall detection
probability (Pd) across four interference types was **0.980**, with slice
localization accuracy of **0.982** (versus a 0.167 random-guess baseline). This
result comes from a separate synthetic wireless-interference benchmark, not
rotating-equipment data, and is presented as supporting evidence that the
fixed-false-alarm-rate framework is a generally applicable technique for
industrial signal monitoring.

## 5. Limitations

We do not hide the honest limitations of this work.

1. **All acoustic results are synthetic.** This is the largest and least
   avoidable limitation in this paper. The physics (defect-order AM sidebands,
   gear-mesh modulation, imbalance harmonic dominance) is textbook-correct,
   but real machine sound also carries structural resonances, reflections,
   multi-source interference, and non-Gaussian ambient noise that a procedural
   synthesizer does not capture. **Validation against MIMII or DCASE Task2
   real recordings is a mandatory next step, and until then the acoustic
   accuracy numbers in this paper should not be treated as representative of
   field performance.**
2. **Single dataset, single bearing, single fault severity.** CWRU is the
   standard academic benchmark but represents one bearing model and geometry
   with lab-induced EDM faults. Real equipment fleets have many bearing types,
   mixed fault severities, and naturally evolving, not instantaneous, defects.
3. **No sensor integration.** This experiment consumes pre-recorded files. A
   real product needs an actual accelerometer/microphone data path (edge
   sampling, anti-aliasing, mounting-point consistency). Mounting location
   materially changes the vibration transfer path, a known field failure mode
   for vibration PdM.
4. **No per-machine calibration.** The envelope defect features assume known
   RPM and bearing geometry per machine and instant. A real product needs
   either a tachometer signal or order-tracking from the vibration signal
   itself, plus a per-installation calibration step to establish what a
   healthy baseline looks like.
5. **No run-to-failure or early-warning validation.** This is fault-versus-
   healthy classification at a fixed severity, not validation of the actual
   PdM value proposition, catching degradation before failure with sufficient
   lead time. That requires run-to-failure trend data (for example, the
   IMS/FEMTO bearing datasets) as a distinct follow-on experiment.
6. **The noise model is synthetic even for vibration.** White Gaussian noise
   is a first approximation for a realistic robustness test. Real field noise
   includes structural resonances, electrical interference, and non-stationary
   background from other rotating equipment. A more realistic test would
   inject measured plant-floor background noise rather than white Gaussian.

None of these gaps require deep learning to close. They are sensor-integration,
geometry-generalization, and longitudinal-data gaps, consistent with the
classical-first approach of this paper.

## 6. Data and reproducibility

**Vibration (CWRU), real, reproducible.** We downloaded the original public
`.mat` files directly from `engineering.case.edu` (no mirrors, no scraping).
The CWRU Bearing Data Center terms permit free academic and research use. The
sensor is a drive-end accelerometer on a 6205-2RS JEM SKF deep-groove ball
bearing at 12kHz sampling. Reproduction must preserve the load-condition split
(0/1/2hp training, 3hp test); a window-level random split leaks information
across the split and inflates the resulting numbers.

**Acoustic, synthetic, code available.** No dataset link is provided because
no real recording was used. Section 3.2 above describes the synthesis
procedure (rotational fundamental, gear mesh, bearing defect orders, AM
modulation scheme, background noise model) at a level sufficient for
reproduction. Readers seeking real-world validation can rerun the same
feature-extraction and classification pipeline against MIMII
(zenodo.org/record/3384388, CC-BY-4.0) or DCASE Task2.

**Fixed-false-alarm-rate (CA-CFAR), synthetic, separate domain.** This is
supporting evidence from a synthetic wireless-interference benchmark unrelated
to rotating-equipment data, and should be cited only for the general
applicability of reference-cell threshold inversion as a methodology.

## References

1. Randall, R. B., Antoni, J. (2011). Rolling element bearing diagnostics: A
   tutorial. *Mechanical Systems and Signal Processing*, 25(2), 485-520.
2. Case Western Reserve University Bearing Data Center. Public bearing-fault
   vibration dataset. engineering.case.edu (free for academic/research use).
3. Purohit, H. et al. (2019). MIMII Dataset: Sound Dataset for Malfunctioning
   Industrial Machine Investigation and Inspection. zenodo.org/record/3384388
   (CC-BY-4.0).
4. DCASE Challenge, Task 2: Malfunctioning Industrial Machine Investigation
   and Inspection.
5. Rohling, H. (1983). Radar CFAR thresholding in clutter and multiple target
   situations. *IEEE Transactions on Aerospace and Electronic Systems*,
   AES-19(4), 608-621.
6. Skolnik, M. I. *Introduction to Radar Systems*, 3rd ed., McGraw-Hill,
   chapter 6 (detection theory and CFAR).
7. Moose, P. H. (1994). A technique for orthogonal frequency division
   multiplexing frequency offset correction. *IEEE Transactions on
   Communications*, 42(10), 2908-2914.
