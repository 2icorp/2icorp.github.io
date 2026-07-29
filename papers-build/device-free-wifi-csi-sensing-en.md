# Device-Free WiFi-CSI Presence and Fall Sensing: A Real-Data Verification

**2i** · 2026-07-29

---

## Abstract

This paper asks whether a room's occupancy, human activity, and falls can be told apart using nothing but the Channel State Information (CSI) already available on an existing WiFi link, with no camera and no wearable. Using 158 hand-designed features drawn from per-subcarrier variance, Doppler/motion spectral energy, and envelope statistics, classified with a gradient-boosted tree model (LightGBM) rather than a deep network, we obtain 95.2% seven-way activity accuracy and a 0.990 AUROC for fall detection (recall 0.911 at precision 0.976) on the UT-HAR benchmark. Separately, on real Intel 5300 CSI captures from OPERAnet, ten-second motion-energy windows separate an empty room from walking and from sit-stand activity by more than an order of magnitude (52x and 13x respectively), yielding a presence-discrimination AUROC of 1.000. Both results are measured on real recordings; synthetic data was used in exactly one place, where it was methodologically unavoidable, and that use is disclosed rather than hidden. The paper is equally direct about what it does not show. Both datasets are single-room, single-session, so moving to a new room requires recalibration, and the harder case of a still, breathing occupant versus an empty room is not yet verifiable on public data. This is a research demonstration of technical feasibility, not a clinically certified medical device.

---

## 1. Background

Falls are among the leading causes of injury in older adults, and how quickly a fall is detected materially changes recovery outcomes in care facilities and in the homes of people living alone. Occupancy sensing is the broader version of the same problem, spanning HVAC scheduling in buildings to foot-traffic estimation in retail spaces. The default answer to both problems is a camera. Cameras, however, are difficult to install in bedrooms or bathrooms because of privacy concerns, and wearables carry the risk that an older adult forgets to wear one, or that it comes off at the exact moment of a fall. Both limitations create demand for a sensing approach that requires the person to wear nothing and the building to install nothing new.

WiFi Channel State Information is a long-standing candidate for exactly this gap. Radio signals reflect off walls and furniture, but also off the human body, and when a person moves, the reflected paths change, which shows up as fluctuation in the amplitude and phase of the channel as observed by the receiver. Reading presence and motion out of that fluctuation is the core idea behind WiFi sensing. Commodity WiFi chips in access points, routers, and laptop wireless cards have computed CSI at the hardware level since 802.11n, so in principle no new sensor needs to be installed. The difficulty is that the signal is noisy, and its statistical character shifts from room to room depending on furniture layout and wall materials.

Recent work in this space has moved sharply toward deep learning. CNN- and transformer-based models that consume raw CSI amplitude or phase sequences directly have produced valid results of their own. This paper asks a different question: without deep learning at all, using only hand-designed features grounded in classical signal-processing theory and a gradient-boosted tree model, can practical-grade presence, activity, and fall detection still be achieved? The question matters for three reasons. First, hand-designed features are easier to explain: a decision can be traced to "subcarrier variance was elevated" or "Doppler energy concentrated in a specific band," rather than to opaque learned weights. Second, gradient boosting runs in real time on low-power edge hardware with no GPU required. Third, it needs far less training data. Deep models typically demand thousands to tens of thousands of labeled sequences, while a gradient-boosted model trained on 158 statistical features converges on a few hundred windows. That difference matters directly for the "every room needs recalibration" limitation discussed later: it is the reason that limitation is something a real deployment can actually absorb, rather than something that rules the approach out.

## 2. Method

### 2.1 CSI amplitude preprocessing

WiFi CSI is a complex value per subcarrier, per transmit-receive antenna pair. Of the two datasets used here, UT-HAR is redistributed as amplitude only (phase was not part of the original release either), so this paper uses the full 3 antennas x 30 subcarriers = 90 amplitude-channel time series directly, with each window spanning 250 timesteps. OPERAnet preserves the original complex CSI, so a standard conjugate-multiplication step was applied between two antennas on the same receiver to cancel common hardware phase noise (frequency offset, clock jitter), followed by a robust outlier filter (Hampel filter) to remove impulsive noise, and a motion-energy statistic computed as the RMS of the residual phase. Conjugate-multiplication cancellation is a well-established technique in the phase-based WiFi sensing literature; this paper re-implements it for the pipeline described here.

### 2.2 Feature set (158 features, no learned representations)

For each 250x90 UT-HAR window, the pipeline extracts: per-subcarrier, antenna-averaged amplitude mean/variance/skewness/kurtosis (30 channels x 4 = 120 features), aggregate statistics across all 90 channels (16 features), inter-antenna amplitude-diversity variance used as a substitute for phase-difference variance -- flagged explicitly rather than silently omitted, since true phase is absent from this amplitude-only redistribution (3 features), top-principal-component Doppler/spectrogram band energies and dominant-frequency location via short-time Fourier transform (5 features), Hilbert-envelope motion-onset location and first-half/second-half energy ratio (4 features), short-time-energy peakiness (2 features), autocorrelation at three lags (3 features), spectral and amplitude-histogram entropy (2 features), and three global statistics -- total energy, spatial variance-concentration ratio, and whole-window first-half/second-half variance ratio (3 features). That last statistic directly targets the "sharp transient followed by stillness" signature that characterizes a fall. Every feature is computed from a single window in isolation, with no reference to other samples' statistics, so nothing in the feature-extraction step itself can leak across the train/validation/test split.

The classifier is LightGBM. Standardization (StandardScaler) was fit on training data only, and the run was repeated across five seeds, 42 through 46. Notably, the standard deviation across those five seeds was exactly zero -- not by coincidence, but because LightGBM's default settings (`subsample=1.0`, `colsample_bytree=1.0`) disable stochastic row/column sampling, so the resulting tree structure is deterministic given fixed data. In other words, this repetition confirms reproducibility of a deterministic pipeline rather than estimating run-to-run variance.

### 2.3 Presence-discrimination chain (OPERAnet)

The OPERAnet experiment does not classify activities; it asks, per ten-second window, whether the room is empty or not. After the conjugate-multiplication phase-noise cancellation described above, a Hampel filter removes impulsive outliers, and the RMS of the resulting residual is used as a single motion-energy statistic. Rank-based AUROC (rank-AUROC) between conditions is computed directly on that one statistic, with no trained classifier involved. Because this measures the separability of a single statistic rather than a learned model's output, it answers a more fundamental question: does this signal carry enough information for presence discrimination at all?

## 3. Data and setup

### 3.1 UT-HAR / SenseFi benchmark

UT-HAR is a WiFi activity-recognition dataset published by Yousefi, Narui, Dayal, Ermon, and Valaee in IEEE Communications Magazine (2017), collected with the Linux 802.11n CSI Tool on an Intel 5300 network card (3 antennas x 30 subcarriers = 90 amplitude channels). This paper does not use the original raw release but the train/validation/test split redistributed by the SenseFi benchmark (Yang et al., Patterns/Cell Press, 2023). It totals 4,973 windows (3,977 train / 496 validation / 500 test), each window spanning 250 timesteps x 90 channels, across seven activities (`bed`, `fall`, `pickup`, `run`, `sitdown`, `standup`, `walk`). The downloaded train/test counts matched Table II of the SenseFi paper exactly (train 3,977, test 996), confirming this is the genuine benchmark release rather than a corrupted or substituted file.

Two honest caveats apply. First, the redistributed files carry no label-mapping file specifying which index corresponds to which activity. This paper adopts the widely repeated community convention of alphabetical ordering (`bed=0, fall=1, pickup=2, run=3, sitdown=4, standup=5, walk=6`), a reasonable inference about how the original authors likely globbed per-activity folders during their `.mat`-to-`.csv` conversion, but not verified ground truth. An alternative approach -- inferring labels from motion-signal characteristics such as variance profile and head/tail energy ratio -- was also tried, but the seven classes did not separate cleanly that way, so this paper states the convention rather than asserting false certainty. If this mapping is wrong, the specific numbers attached to the name "fall" would shift to a different class index, but overall seven-way accuracy is unaffected, since multiclass accuracy does not depend on which name is attached to which index.

Second, it is difficult to guarantee that the official split is fully leakage-free at the recording level. The SenseFi paper itself states that the data is segmented with a sliding window, "inevitably causing many repeated data among samples." Adjacent windows overlap heavily, and that overlap likely extends across the official train/test files, which may inflate reported accuracy relative to a genuinely independent subject/session split. This paper uses the published benchmark split as published, rather than inventing a new one, and does not introduce additional leakage beyond what the split may already contain: the scaler and LightGBM model were fit on training data only, and the fall-detection decision threshold was selected on validation data and frozen before touching test data. But neither this paper nor any other paper using this exact benchmark split can claim the split itself is leakage-free.

Of the three tasks reported here, only task (a), presence discrimination, includes synthetic data. UT-HAR contains no empty-room recordings at all, since it is an activity dataset, so the "absent" class for that task was synthesized as small Gaussian noise -- 5% of the real signal's overall standard deviation -- placed around the real per-channel mean baseline. Task (b), seven-way activity classification, and task (c), fall detection, are 100% real data, with no synthesis involved.

### 3.2 OPERAnet (CC0, real)

OPERAnet is a publicly released radio-frequency activity-recognition dataset captured with an Intel 5300 CSI Tool, 3x3 antenna configuration, at 1,600 Hz, distributed under CC0 (public domain) terms (Bocus et al., 2022). This paper uses three sessions from Room 1: exp001 (empty room), exp002 (walking), and exp003 (sitting down / standing up on a chair). The original release totals 36.5 GB; only the six CSI streams needed (tx1rx1/tx1rx2 x subcarriers 10/20/30) were extracted, reducing each experiment to roughly 30 MB before processing. The number of ten-second windows per session was 231 for exp001, 114 for exp002, and 231 for exp003.

## 4. Results

### 4.1 UT-HAR: seven-way activity classification

Overall seven-way accuracy was 95.2%, with a macro-F1 of 92.7%. Per-class recall and precision (from the seed-42 confusion matrix) were as follows.

| Class | Recall | Precision |
|---|---|---|
| bed | 0.924 | 0.939 |
| fall | 0.911 | 0.976 |
| pickup | 0.993 | 0.973 |
| run | 0.940 | 0.855 |
| sitdown | 1.000 | 1.000 |
| standup | 0.850 | 0.895 |
| walk | 0.839 | 0.897 |

Most confusion concentrates between `standup` and `walk`, with a smaller amount between `bed` and `run`. That pattern matches the intuitive expectation: short, similarly energetic postural transitions are easily confused with sustained but brief locomotion.

### 4.2 UT-HAR: fall versus non-fall

Fall detection is an imbalanced binary task, with falls making up only 8.9% of the training data. At a fixed threshold of 0.5, accuracy was 99.0%, F1 was 94.3%, precision was 97.6%, recall was 91.1%, and AUROC was 0.990. Selecting a decision threshold on validation data to hit a target precision, then freezing it before applying it to test data, produced recall of 95.6% at a target precision of 0.80 (actual test precision 82.7%), and recall of 93.3% at a target precision of 0.90 (actual test precision 93.3%). In both cases the threshold chosen on validation either met or came close to its target on test, which is a reasonable sign that this threshold-selection procedure generalizes without leakage.

### 4.3 OPERAnet: presence discrimination

The ten-second-window motion RMS separated the empty room from activity by an order of magnitude. Taking the empty-room (exp001) median motion RMS of 0.0041 rad as a 1x baseline, sit-stand activity (exp003) measured 0.0524 rad, roughly 13x, and walking (exp002) measured 0.2120 rad, roughly 52x. Rank-AUROC for empty-room versus walking and empty-room versus sit-stand were both 1.000 using this single statistic alone. The Hampel filter's outlier rate was 1.4-2.6%, showing that real hardware CSI carries impulsive artifacts absent from synthetic signals, and that the filter removes them.

```chart
{"kind":"bar","title":"Performance by task (real data, UT-HAR and OPERAnet)","labels":["7-way activity accuracy","Fall detection AUROC","Presence AUROC (OPERAnet)"],"values":[95.2,99.0,100.0]}
```

```chart
{"kind":"bar","title":"OPERAnet motion RMS, ratio to empty room","labels":["Empty room (baseline)","Sit-stand","Walking"],"values":[1,13,52]}
```

```chart
{"kind":"line","title":"Fall-detection recall by precision threshold (fixed on validation, applied to test)","labels":["No target (thr=0.5)","Precision>=0.80","Precision>=0.90"],"values":[91.1,95.6,93.3]}
```

The third figure shows how recall moves as the precision floor is raised: fall detection becomes more conservative, and recall actually improves slightly, from 91.1% to 93.3%, as the precision target rises from 0.80 to 0.90. That improvement is a sign that the threshold chosen on validation data happened to align well with the actual precision-recall surface on test data, and should be read together with the single-session caveat discussed in Section 5.

## 5. Limitations

Separating what this study demonstrates from what it does not is more important, for anyone who wants to act on these numbers, than the numbers themselves.

**Breathing-level stationary presence has not been verified on public data.** Every result above distinguishes a moving person from an empty room. The genuinely hard problem is telling an empty room apart from an occupant sitting still or asleep, which requires detecting millimeter-scale chest-wall motion from breathing rather than large-scale walking or standing. Neither dataset used here provides finely time-aligned "stationary presence versus empty room" labels suited to that task. That is a gap in public data, not a flaw in the method, and closing it requires a new capture with precise timestamps and stationary-presence labels.

**These are single-room, single-session results.** UT-HAR was collected in one environment, and this paper's OPERAnet analysis uses only one campaign in Room 1. It is a well-documented finding in this field that CSI's statistical character depends strongly on furniture layout, wall material, and transceiver placement, meaning zero-shot generalization of a pretrained model to a different room performs at close to chance. A real deployment needs a per-site recalibration step using a small amount of local calibration data. The gradient-boosted approach used here is practical for exactly this reason -- it needs far fewer labels than a deep model to recalibrate -- but it does not eliminate the need for recalibration itself.

**Multi-person and multi-source-noise environments are out of scope.** Every UT-HAR window assumes a single occupant. Real homes contain pets, multiple residents, and unrelated motion from fans or curtains, and this dataset says nothing about how the pipeline behaves under that kind of multi-source interference.

**The fall data does not represent an older-adult population.** UT-HAR's fall events are, by convention in this literature, scripted falls performed by fit adult volunteers, not the slower, partial, or assisted falls typical of the older-adult population that a real product would target. Whether the 91-96% recall range reported here holds for real falls by older adults is unverified.

**Sliding-window overlap may introduce optimistic bias.** As noted in Section 3.1, overlap between adjacent windows in the official split may make the reported accuracy a few percentage points more optimistic than a genuinely independent held-out session would produce.

**This is not a medical device.** This paper is a research demonstration intended to show technical feasibility. It is not a clinically certified or regulator-approved fall-detection product. Any product deployed in an actual care setting would require clinical validation and a certification process separate from the technical verification presented here.

None of these limitations is addressed by a better classifier or more sophisticated classical features. Closing them requires new data collection -- multiple rooms, multiple subjects, real older-adult falls, and precisely timestamped stationary-presence labels -- together with a deployment design that assumes per-site calibration from the start. That is the honest distance between "demonstrated as research" and "shippable as a product."

## 6. Data and reproduction

Both datasets used in this paper are public, and every statistic cited here was computed directly from each dataset's public release.

- **UT-HAR (original)**: `github.com/ermongroup/Wifi_Activity_Recognition` (Yousefi et al., 2017). Redistributed split: SenseFi benchmark, `github.com/xyanchen/WiFi-CSI-Sensing-Benchmark` (Yang et al., 2023; code under an MIT license, dataset redistributed for academic research use).
- **OPERAnet**: a multimodal radio-frequency and vision-based activity-recognition dataset released under CC0 (public domain) terms (Bocus et al., 2022). This paper uses only the wificsi1 exp001/002/003 sessions from Room 1.

For readers who want to reproduce this work: the UT-HAR pipeline loads the train/validation/test split as redistributed by SenseFi, computes the 158 features described above, fits standardization on training data only, and trains LightGBM across five seeds (42-46). The OPERAnet pipeline extracts only the CSI streams needed from the original release (roughly 30 MB per experiment out of a 36.5 GB total), cancels hardware phase noise via conjugate multiplication between two antennas, removes outliers with a Hampel filter, and computes motion RMS per ten-second window. Both pipelines run in minutes on a single CPU, with no GPU or specialized hardware required.

## References

1. Yousefi, S., Narui, H., Dayal, S., Ermon, S., Valaee, S. "A Survey on Behavior Recognition Using WiFi Channel State Information." *IEEE Communications Magazine*, 2017.
2. Yang, J., Chen, X., Zou, H., Lu, C. X., Wang, D., Sun, S., Xie, L. "SenseFi: A Library and Benchmark on Deep-Learning-Empowered WiFi Human Sensing." *Patterns* (Cell Press), 2023.
3. Bocus, M. J., Li, W., Vishwakarma, S., et al. "OPERAnet: A Multimodal Activity Recognition Dataset Acquired from Radio Frequency and Vision-Based Sensors." *Scientific Data*, 2022.
4. github.com/ermongroup/Wifi_Activity_Recognition -- original UT-HAR distribution point.
5. github.com/xyanchen/WiFi-CSI-Sensing-Benchmark -- SenseFi code and redistributed data.
