# Where an RF Fingerprint Lives and Dies in the Receiver Chain

**2i** · 2026-07-29

## Abstract

Systems that build RF fingerprinting (RFFI) into a real receiver often carry an
unexamined assumption: it is fine, or even better, to extract the fingerprint after
the signal has passed through the standard receiver chain - automatic gain control
(AGC), carrier frequency offset (CFO) correction, symbol timing recovery, and carrier
phase recovery. We tested this assumption directly with a probe-point ablation. On a
synthetic device-fleet dataset (10 virtual transmitters, 2 virtual receivers, 60
packets each, multiple channel conditions, fixed seed) we trained an independent
small 1D-CNN at each of seven points along the receiver chain (P0 raw IQ through P7
demodulated symbols) and compared them under identical metrics. The result is the
opposite of the common assumption. Fingerprint separability is strongest at the very
front of the chain (P0 raw IQ, P1 post-AGC), where the equal error rate (EER) sits
around 0.31. As the signal passes through CFO correction, symbol timing recovery,
and carrier phase recovery, EER degrades monotonically, reaching 0.499 at the final
demodulated-symbol stage (P7). From a verification standpoint, 0.499 is statistically
indistinguishable from chance (0.5). In other words, the standard engineering choice
of tapping late in the chain erases the fingerprint almost entirely, at least under
these conditions. We explain this physically, and we address head-on why a prior
study on real hardware reported the opposite direction (later probe points being
better for open-set verification). We also do not hide that absolute separability is
weak, and that this conclusion is partly bounded by the limits of synthetic data.
Reporting the real numbers alongside their limits is the point of this paper.

## 1. Background

RF fingerprinting starts from the fact that two radios of the identical model do not
behave identically. Oscillator phase noise, ADC/DAC nonlinearity, IQ imbalance, and
power-amplifier (PA) compression and distortion characteristics all vary slightly
device to device because of manufacturing tolerance in the analog front end, and
that variation leaves a reproducible trace in the radiated waveform. RF fingerprinting
extracts that trace as a feature to decide "which device sent this signal" or "did
this signal come from a registered device." Because it derives an identity signal
purely from the physical layer, without adding a credential, it keeps being proposed
for use cases like authenticating industrial IoT gateways or detecting unregistered
devices on a factory wireless network.

Any engineer who wants to put this into a real receiver's software must face one
concrete design decision: at which point in the receiver chain should the signal be
tapped and fed to the fingerprint model? A typical receiver chain takes raw IQ
samples, normalizes power with AGC, corrects CFO, recovers symbol timing, passes
through an equalizer, recovers carrier phase, and finally demodulates symbols. This
pipeline is designed to optimize communication performance (bit error rate). From a
communication standpoint, the signal after all these stages is always "cleaner." It
therefore feels natural to also extract the fingerprint from this refined signal, and
in fact some prior work reports that a post-synchronization point is better for
open-set decisions. But that intuition rests on an unverified premise: that
communication performance and identifiability move in the same direction.

Physically, the opposite is at least as plausible. AGC can normalize away
power-related impairments (for example, the magnitude component of PA gain
compression). CFO correction estimates and subtracts exactly the physical quantity
that varies device to device - the oscillator offset itself. Symbol timing recovery
and carrier phase recovery likewise treat a device's own timing and phase
characteristics as "error" and correct them. There may be a fundamental tension
between the receiver chain's objective function (minimize bit error rate) and the
definition of a fingerprint (a reproducible, device-specific deviation). Rather than
guess, we measured this tension directly, on the same data, with the same model
capacity, under the same evaluation protocol. The method is simple: tap the signal at
each stage of the receiver chain, store each tap separately, and train an
independent fingerprint classification/verification model at each tap point to
compare performance. The variable is not the model architecture - it is which point
in the chain the signal is intercepted from.

## 2. Method

### 2.1 The probe-point ladder (P0-P7)

We split the receiver chain into eight tap points and recorded each point's signal
independently.

| Probe | Receiver stage | Domain |
|---|---|---|
| P0 | Raw IQ (receiver input, unprocessed) | Sample rate |
| P1 | After AGC (automatic gain control) | Sample rate |
| P2 | After coarse CFO (carrier frequency offset) correction | Sample rate |
| P3 | After matched filtering | Sample rate |
| P4 | After symbol timing recovery | Symbol rate |
| P5 | After carrier phase recovery | Symbol rate |
| P6 | After the equalizer | Symbol rate |
| P7 | Final demodulated symbols | Symbol rate |

P6 (the equalizer) has no measured data in this run, because this run's data-generation
pipeline is configured to skip the equalization stage. The ladder therefore consists of
seven measured points: P0, P1, P2, P3, P4, P5, and P7. The absence of P6 does not
change the interpretation of the results - both neighboring points, P5 (carrier
phase) and P7 (final demodulation), have already reached an EER near chance, leaving
little room for whatever lies at P6 to reverse the ladder's direction.

P0-P3 live in the sample-rate domain (a time series measured in samples per second),
while P4, P5, and P7 live in the symbol-rate domain (a time series measured in
symbols per second). Because the two domains have different time-axis scales, we used
different window lengths for each: 256 samples for the sample-rate points, 64 symbols
for the symbol-rate points. We drew up to 3 evenly spaced windows per packet.

### 2.2 Model and embedding

We trained an independent 1D-CNN at each probe point. The architecture is four 1D
convolutional layers (channels 2->64->64->128->128, kernel size 7, each followed by
batch normalization, ReLU, and max-pooling), followed by global average pooling, a
fully connected layer (128->128) producing a 128-dimensional embedding, and then a
classification head (128->8) on top of that embedding with dropout (0.3). The input
splits complex IQ into a 2-channel [real, imaginary] representation and normalizes it
by RMS power. We used the identical architecture and identical hyperparameters at
every probe point (40 epochs, batch size 128, learning rate 1e-3) - the only variable
was which point's signal was fed in.

### 2.3 Evaluation metrics (four)

**same-rx acc**: 8-way classification accuracy on held-out packets (the last 30% of
each group) from the same virtual receiver (rx0) used in training. **cross-rx acc**:
the same 8-way classification accuracy, but on the full packet set from a virtual
receiver (rx1) that never appeared in training. **gap** (= same-rx acc minus
cross-rx acc): a proxy for whether that point's "fingerprint" is actually learned
receiver-specific characteristics (receiver nuisance) rather than a true transmitter
fingerprint. A large gap means the model learned the idiosyncrasies of the specific
rx0 receiver rather than the transmitter itself. **EER (Equal Error Rate)**: the
central verification-side metric. Using the 128-dimensional embedding, we compute
cosine similarity across all rx1 samples (both the 8 known/registered transmitters
and the 2 unknown/unregistered ones), obtain score distributions for genuine pairs
(same transmitter) and impostor pairs (different transmitters, including unknown
ones), and find where the false accept rate (FAR) and false reject rate (FRR) cross
via linear interpolation. **unknown mean maxcos**: for the two unregistered
transmitters, the average of each sample's maximum cosine similarity to any of the
eight registered-class centroids (the mean training-set embedding per class). Lower
is better - it means open-set rejection (not mistaking an unregistered device for a
registered one) is working well.

We report all four together because any single metric is easy to misread on its own.
Classification accuracy alone tempts the conclusion "this point carries the
fingerprint," but if the gap is large that accuracy may just be overfitting to
receiver-specific characteristics. EER isolates pure verification performance
(registered vs. unregistered) and is closer to an actual deployment scenario than
classification accuracy. unknown mean maxcos catches a different failure mode than
EER does - specifically, mistaking an unregistered device for a registered one.

## 3. Data and setup

We ran the experiment on a synthetic virtual device-fleet dataset produced by our own
synthetic fleet generator. It contains 10 virtual transmitters, 2 virtual receivers,
60 packets per transmitter, multiple channel conditions, and a fixed seed for
reproducibility. Each virtual transmitter is treated as a distinct "device" with its
own individually assigned impairment parameters (IQ imbalance, PA nonlinearity, CFO,
phase noise, and similar). Each virtual receiver is likewise a distinct "receiver"
with its own randomly assigned impairment parameters, so rx0 and rx1 have different
reception characteristics - this is by design, to test whether the fingerprint
survives on a receiver that never appeared during training (the cross-rx evaluation).

Eight of the ten transmitters (tx0-tx7) form the known (registered) set,
corresponding to the eight classes the classification head learns. The remaining two
(tx8, tx9) form the unknown (unregistered) set, which never appears in training and
is used only for the open-set evaluation (unknown mean maxcos). Train/test splits
are done at the group level (transmitter x receiver x channel condition): the first
70% of each group's packets (positions 0-41 in packet order) go to training, and the
remaining 30% (positions 42-59) go to the same-rx evaluation. The cross-rx evaluation
uses the entirety of rx1's packets (no split is needed, since rx1 never appears in
training at all).

Three limitations of this setup deserve to be stated plainly. First, this is
synthetic data. Whether the virtual fleet's impairment distribution resembles a real
hardware fleet's impairment distribution has not been separately verified (a
sim-to-real gap). Second, the cross-rx evaluation uses only two virtual receivers -
far too small a sample to represent real SDR hardware diversity. Third, absolute
separability itself is weak - as shown below, even the best point (P0) reaches under
0.4 classification accuracy on an 8-way task. All three limitations bear more heavily
on the reliability of absolute values than on the direction of the result (which
point is relatively better). Throughout this paper we treat the relative ranking
across points as the more trustworthy conclusion, and the absolute values as
suggestive rather than final.

## 4. Results

Table 1 summarizes the four metrics at each of the seven probe points. Chance-level
8-way classification accuracy is 1/8 = 0.125; chance-level verification (EER) is 0.5.

**Table 1. Fingerprint preservation by probe point (measured)**

| Probe (stage) | same-rx acc | cross-rx acc | gap | EER | unknown maxcos |
|---|---|---|---|---|---|
| P0 raw IQ | 0.387 | 0.377 | 0.010 | 0.307 | 0.923 |
| P1 AGC | 0.397 | 0.368 | 0.030 | 0.306 | 0.928 |
| P2 coarse CFO | 0.327 | 0.315 | 0.012 | 0.330 | 0.928 |
| P3 matched filter | 0.265 | 0.272 | -0.008 | 0.410 | 0.927 |
| P4 symbol sync | 0.155 | 0.148 | 0.007 | 0.489 | 0.883 |
| P5 carrier phase | 0.167 | 0.160 | 0.007 | 0.493 | 0.876 |
| P7 demod symbols | 0.130 | 0.138 | -0.008 | 0.499 | 0.872 |

Ranked by gap and EER together (lower is better): P0 approximately equal to P1 > P2
> P3 > P7 > P4 > P5. The two figures below visualize this ladder.

```chart
{"kind":"line","title":"EER ladder across probe points (measured, chance=0.5)","labels":["P0 rawIQ","P1 AGC","P2 CFOcorr","P3 matchedfilt","P4 symbolsync","P5 carrierphase","P7 demodsym"],"series":[{"name":"EER","values":[0.307,0.306,0.330,0.410,0.489,0.493,0.499]}],"note":"EER worsens monotonically along the chain, reaching chance (0.5) at P7."}
```

```chart
{"kind":"bar","title":"same-rx vs cross-rx classification accuracy (8-way, chance=0.125)","labels":["P0 rawIQ","P1 AGC","P2 CFOcorr","P3 matchedfilt","P4 symbolsync","P5 carrierphase","P7 demodsym"],"series":[{"name":"same-rx acc","values":[0.387,0.397,0.327,0.265,0.155,0.167,0.130]},{"name":"cross-rx acc","values":[0.377,0.368,0.315,0.272,0.148,0.160,0.138]}],"note":"The two curves nearly overlap, meaning gap stays small at every point - evidence that the ladder reflects real fingerprint loss, not receiver-specific overfitting."}
```

The first observation is that EER worsens monotonically from about 0.31 at P0/P1 to
about 0.49-0.50 at P4/P5/P7. P7's EER of 0.499 is practically indistinguishable from
chance (0.5) - it is reasonable to say the verification-relevant fingerprint has
statistically vanished by the final demodulated-symbol stage. The second observation
is that the gap stays small at every point (between -0.008 and 0.030). A small gap
means same-rx accuracy is not memorized rx0-specific characteristics; it survives
almost intact on rx1, which never appeared in training. This strengthens the case
that the EER decline above is a real loss of fingerprint information passing through
the chain, not an artifact of varying degrees of receiver overfitting at different
points.

The third observation is subtler. Unknown mean maxcos does not move in exactly the
same direction as EER. It stays roughly flat (0.923-0.928) across P0-P3, then drops
to 0.883 at P4 and further to 0.876 and 0.872 at P5 and P7. In other words, the
maximum similarity between unregistered transmitters and the registered eight-class
centroids actually decreases toward the back of the chain - taken alone, this metric
could be misread as "the back of the chain is better for open-set rejection," the
opposite of our headline conclusion. That reading is a trap. The drop in maxcos is
more plausibly a side effect of the fact that the known eight classes' embeddings
stop separating from each other at all in the back half of the chain (same-rx
accuracy has already collapsed to 0.13-0.17 there) - when classes collapse into a
single blob, an unknown sample sitting outside that blob looks "less close" not
because discrimination improved, but as a byproduct of discrimination having
collapsed. EER does not fall into this trap, because it weighs both genuine and
impostor errors together. For that reason this paper treats EER and gap as the
primary metrics, and unknown maxcos as a supporting one.

At the absolute level, even the best point (P0) reaches only 0.387 classification
accuracy on an 8-way task - more than three times chance (0.125), but far below what
a practical authentication system would require. As noted in Section 3, this
suggests either that the synthetic impairments assigned across the ten devices are
too similar to each other (a conservative parameter range), or that window length and
training epochs were insufficient. This paper's central claim (the front of the
chain is better) rests on relative ordering across points, not on absolute level, so
this weakness does not invalidate the core conclusion - but it does mean this dataset
should not be used directly as an estimate of a real deployed system's performance.

## 5. Implications

The most direct implication is practical. If you are designing an RF fingerprint
verification stack, and the impairment types your fingerprint depends on resemble
what our synthetic data models (IQ imbalance, CFO, phase-noise-family impairments),
acquire the embedding right after AGC and before CFO correction (P0/P1). Acquiring it
after symbol timing recovery, carrier phase recovery, or final demodulation - which
looks like a "cleaner" signal from a communications standpoint - means the
fingerprint information has already been largely destroyed by that point. This
experiment puts a concrete number on the gap between the point that is optimal for
communication performance and the point that is optimal for fingerprint extraction:
an EER of 0.31 versus 0.50.

The second implication is more interesting, and deserves to be treated honestly. A
prior study on real hardware ("Where You Tap Matters," arXiv:2607.21564) reported
that a post-timing/carrier-recovery point is better for open-set decisions - exactly
the opposite direction from our result. Declaring "we are right and they are wrong,"
or the reverse, would be premature. Instead we propose two physical hypotheses for
where the difference could come from. First, the real-hardware fingerprint in that
study may include components that synchronization algorithms cannot correct (for
example, PA memory effects, or spurious emissions that are not fully modeled), while
at the same time synchronization removes a genuine nuisance factor (channel noise),
making the net effect positive there. Second, our synthetic fingerprint is
concentrated in impairment types - CFO and phase-noise-like effects - that a
synchronization algorithm can, by definition, estimate and correct almost perfectly,
while the channel nuisance itself is already small in our setup (gap stays under
0.03 at every point) - meaning there is little channel noise left for
synchronization to remove, so correcting the fingerprint itself dominates and the net
effect is negative.

If this interpretation holds, it points two ways at once. (a) If you are deploying an
impairment-based fingerprint in practice, pulling the acquisition point earlier than
the synchronization chain is at minimum a safe default choice - even in the
worst case (a fingerprint concentrated in fully correctable components, as in our
simulation), it does not lose information. (b) At the same time, it should be
acknowledged that our synthetic fingerprint model may be "too correctable" compared
to real hardware. Sync-invariant components that real devices carry - for example, PA
memory effects, or residual phase distortion that resists calibration - may be
underrepresented in the synthetic data. That is a limitation of the dataset, not an
error in the conclusion, but it does mean this paper's ranking should be read as
conditional on impairment type, not universal.

The third implication is methodological. We looked at four metrics rather than one,
and as a result observed unknown maxcos moving in a different direction than EER. Had
we looked only at unknown maxcos, we would have reached the opposite conclusion -
that the back of the chain is better for open-set rejection. This generalizes into a
broader caution for fingerprinting research: open-set performance should be reported
with discriminability (separation among known classes, EER) and rejection power
(separation of unknown from known, maxcos-family metrics) reported separately, not
collapsed into one number. Picking whichever single metric happens to look good can
read in the wrong direction entirely.

## 6. Data and reproduction

This experiment can be reproduced in three stages. (1) Synthetic fleet generation -
generate signals from 10 virtual transmitters and 2 virtual receivers, 60 packets per
transmitter, multiple channel conditions, and a fixed seed, and record IQ
independently at each stage of the receiver pipeline (P0-P5 and P7 - the equalizer
stage P6 is omitted from this pipeline configuration). (2) Data preparation - slice
windows per packet at each probe point. Sample-rate points (P0-P3) use a 256-sample
window; symbol-rate points (P4, P5, P7) use a 64-symbol window; up to 3 evenly spaced
windows are drawn per packet. Each window is stored alongside metadata (packet ID,
transmitter index, receiver index, channel-condition index, position within its
group). (3) Independent per-point training and evaluation - train the 1D-CNN
described in Sections 2.2/2.3 independently at each probe point, and compute
same-rx acc, cross-rx acc, gap, EER, and unknown mean maxcos at each. For EER, we
prefer a validated biometric-verification library (pyeer) when available, and fall
back to computing the FAR/FRR crossing directly via threshold sweep and linear
interpolation when it is not - both paths follow the same definition (the FAR=FRR
crossing point) and produce the values reported in this paper.

We repeat the caveats that matter for anyone reproducing this. The data is
synthetic and may differ from a real device fleet's impairment distribution (a
sim-to-real gap). The cross-rx evaluation uses only two virtual receivers and does
not represent real SDR hardware diversity. Absolute accuracy and EER values may be
sensitive to the magnitude of the synthetic fingerprint, model capacity, and training
epoch count, so the relative ranking across probe points should be trusted more than
the absolute numbers. We plan two follow-ups. First, widen the spread of synthetic
impairments across devices and add sync-resistant components (PA memory effects,
uncalibrated phase distortion), then re-measure this ladder to see whether the
P0/P1 advantage holds, or whether a middle point rises the way the real-hardware
literature suggests. Second, apply the identical ablation procedure to a real
over-the-air public dataset to directly measure the sim-to-real gap - though such
public datasets are typically distributed as raw bursts captured before any receiver
chain processing, so a separate probe-regeneration pipeline would be needed, which is
outside the scope of this paper.

## References

1. "Where You Tap Matters" (arXiv:2607.21564) - prior work on probe-point selection
   for RF fingerprint verification on real hardware. Reports that a
   post-timing/carrier-recovery point is favorable for open-set decisions, the
   opposite direction from this paper's result (see Sections 4-5 for discussion).
2. SigMF (Signal Metadata Format) - the open signal-metadata format convention used
   to record IQ in this experiment. https://github.com/gnuradio/SigMF
3. pyeer - the open-source library used for computing the equal error rate (EER) and
   related biometric verification metrics.
