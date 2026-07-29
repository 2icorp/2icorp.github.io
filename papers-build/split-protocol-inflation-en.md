## Summary

We measured WiFi channel state information (CSI) sensing performance while holding the data,
the models, and the training fraction fixed, and changing **only the data split protocol**.
Accuracy ranged from 0.931 down to 0.088. With sixteen classes, chance is 0.0625. A model that
looks 93% accurate under one protocol classifies nothing under another.

The composition of that gap matters more than its size. Adjacent-window leakage, the failure
mode most often cited, accounted for only 1.7 to 5.8 percentage points. Domain shift across
subjects and setups accounted for 77.7 to 81.6 points. Fixing the leakage leaves more than 93%
of the problem untouched. Feasibility of camera-free sensing must therefore be judged on
**cross-domain transfer**, not on reported accuracy.

The collapse is not permanent. Labelling a single trial per class in the target domain lifts
accuracy from 0.090 to 0.454, and twenty trials per class restore 0.873. That is a number a
buyer can turn into a deployment cost.

## Background

Radio-based indoor sensing reads human presence and motion without a camera. It collects no
video, so siting constraints are light, and the literature reports accuracies in the high
nineties with some regularity. To a buyer the evidence looks settled.

The difficulty is that the evaluation procedure behind those numbers is usually not published.
When a time series is cut into overlapping windows that are then shuffled and split at random,
windows from the same trial land on both sides of the partition. Test samples then describe
essentially the same instant as training samples, and the model solves the task by recall
rather than by generalisation.

This note decomposes that effect by measurement rather than by argument, and answers the two
questions that decide a deployment: how far performance falls when the person or the setup
changes, and how much labelling buys it back.

## Method

Three split protocols were defined. Data, models, hyperparameters, and training fraction are
identical across all three; only the partitioning changes.

**P1 random-window.** All windows are pooled, shuffled, and split. Windows from one trial land
on both sides. This is the procedure most commonly used in the literature.

**P2 trial-wise.** The split is made at the trial level, so every window of a trial stays
together. Window leakage disappears, but people and setups still appear on both sides.

**P3 subject-wise.** One person is held out entirely; the model trains on the rest and is
evaluated on that person. No window leakage and no subject overlap.

The P1 minus P2 difference measures adjacent-window leakage. The P2 minus P3 difference
measures domain shift. The training fraction was fixed at 6/7 for all three protocols, matching
the leave-one-subject-out structure so that the comparison is like for like.

Three models were used: a classical baseline of amplitude statistics with a random forest, a
CNN treating subcarrier and time as a two-dimensional input, and a BiLSTM. Normalisation
statistics were always computed on the training split alone.

## Data and setup

We used the public WiAR dataset: raw CSI logs captured with an Intel 5300 wireless card, three
antennas, thirty subcarriers, sampled at 30Hz. Sixteen activities were performed thirty times
each by ten volunteers.

This study uses the seven volunteers who hold all sixteen activities at thirty repetitions.
Parsing 3,361 trials and cutting them into windows of 96 samples with a stride of 32 yields
17,356 windows. With sixteen classes, chance accuracy is 0.0625.

The raw logs pack 8-bit real and imaginary parts at bit offsets, so they were unpacked directly.
Phase is corrupted by carrier and sampling clock offsets and was discarded; only amplitude was
used. The entire pipeline runs on a single laptop and requires no capture hardware.

## Results

### Changing only the split

Mean and standard deviation over seven repetitions. P3 comprises the seven leave-one-subject-out
folds; P1 and P2 were repeated seven times at the same training fraction.

| Model | P1 random-window | P2 trial-wise | P3 subject-wise | P3 train accuracy |
|---|---|---|---|---|
| Statistics + random forest | 0.931 ± 0.005 | 0.873 ± 0.009 | 0.088 ± 0.024 | 1.000 |
| CNN | 0.866 ± 0.006 | 0.849 ± 0.020 | 0.072 ± 0.021 | 0.910 |
| BiLSTM | 0.917 ± 0.006 | 0.876 ± 0.009 | 0.061 ± 0.032 | 0.959 |

```chart
{"kind":"bar","labels":["P1 window-random","P2 trial-wise","P3 subject-wise"],"series":[{"name":"RandomForest","values":[0.931,0.873,0.088]},{"name":"CNN","values":[0.866,0.849,0.072]},{"name":"BiLSTM","values":[0.917,0.876,0.061]}],"ylabel":"test accuracy"}
```

All three models settle near the 0.0625 chance level under P3, while their training accuracy at
the same moment sits between 0.910 and 1.000. The models memorised the training data perfectly
and transferred none of it to a new person.

### Decomposing the gap

| Model | Window leakage (P1 - P2) | Domain shift (P2 - P3) | Total |
|---|---|---|---|
| Statistics + random forest | 5.8 pp | 78.5 pp | 84.3 pp |
| CNN | 1.7 pp | 77.7 pp | 79.4 pp |
| BiLSTM | 4.0 pp | 81.6 pp | 85.6 pp |

```chart
{"kind":"bar","labels":["RandomForest","CNN","BiLSTM"],"series":[{"name":"window leakage (P1-P2)","values":[5.8,1.7,4.0]},{"name":"domain shift (P2-P3)","values":[78.5,77.7,81.6]}],"ylabel":"accuracy gap (pp)"}
```

Domain shift is thirteen to forty-six times larger than adjacent-window leakage. Moving from
random to trial-wise splitting is the right correction, but on its own it removes less than
seven per cent of the problem. Reporting that the evaluation procedure was fixed is not the
same as demonstrating generalisation.

One further observation deserves attention. The CNN is the weakest model under P1 at 0.866 and
also has the smallest total gap. Selecting a model by random-split accuracy discards the
candidate that transfers best.

### Rejecting the label-mismatch explanation

Chance-level cross-subject accuracy could be an artifact of the dataset rather than a property
of the task. If activity indices were numbered differently per volunteer, cross-subject
evaluation would be at chance by construction.

We tested this directly. On the held-out subject's confusion matrix we applied Hungarian
assignment to find the label permutation that maximises accuracy. If the indices were merely
shuffled, this would restore the original performance.

| Held-out subject | Original labels | Best permutation |
|---|---|---|
| 10 | 0.064 | 0.294 |
| 7 | 0.069 | 0.197 |
| 8 | 0.074 | 0.294 |

Even under the optimal permutation, accuracy reaches only 0.197 to 0.294. Against the same
pipeline's within-subject accuracy of 0.951 this is not a recovery. The collapse is genuine
domain shift, not a numbering artifact. The dataset documentation likewise defines the sixteen
activities in a fixed order.

### How much labelling buys back

For each held-out subject we added k labelled trials per class from that subject to the training
set and evaluated on that subject's remaining trials. Selection is made **at the trial level**,
not the window level. Selecting windows would place neighbouring windows of the same trial into
training and reproduce the very inflation this note criticises.

| Labelled trials per class | 0 | 1 | 2 | 3 | 5 | 10 | 20 |
|---|---|---|---|---|---|---|---|
| Accuracy | 0.090 | 0.454 | 0.599 | 0.665 | 0.753 | 0.822 | 0.873 |

```chart
{"kind":"line","labels":["0","1","2","3","5","10","20"],"series":[{"name":"target-domain calibration","values":[0.090,0.454,0.599,0.665,0.753,0.822,0.873]}],"ylabel":"accuracy"}
```

One labelled trial per class already lifts accuracy from 0.090 to 0.454. Twenty restore 0.873,
matching the 0.873 obtained under P2 where subjects were mixed. Domain shift is not an
impassable wall; it is a line item denominated in labelling effort.

The practical reading is direct. What a site costs to commission is what it costs to label, and
that figure is visible only in a curve of this shape, never in a vendor's headline accuracy.

A separate experiment on this board ("WiFi-CSI cross-environment shift and small-sample
calibration") reports degradation under environment change and recovery from a small number of
target labels, on a different dataset and a different task. The datasets and tasks differ, but
the direction agrees. The contribution of this note is not the recovery curve itself; it is the
step before it, **decomposing the gap into leakage and domain shift and showing which one
dominates**.

## Limitations

**Subject and setup are confounded.** WiAR publishes no per-volunteer environment metadata, so
the P3 gap cannot be split into the contribution of the person and that of the equipment
placement. In a real deployment both change together, which makes this condition closer to
production than a cleanly separated one would be.

**The features are deliberately plain.** We used amplitude statistics and standard networks,
with no domain-invariant feature design and no domain adaptation. The claim is not that radio
sensing cannot work. It is that a plain pipeline which looks 93% accurate under random
splitting transfers nothing to a new person, and that only the split protocol reveals it. The
existence of domain-invariant designs is a response to precisely this gap.

**This is an activity-recognition dataset.** WiAR classifies sixteen gestures, which is a
different task from occupancy or dwell-time measurement in a retail space. The absolute numbers
do not transfer to another task. The procedure does: any such task must be split and reported
by domain.

**A single dataset.** Seven subjects, sixteen activities, one capture device. There is no
guarantee that the direction and magnitude of the gap hold elsewhere.

## Data and reproduction

- Dataset: WiAR (WiFi-based Activity Recognition), `https://github.com/linteresa/WiAR`
- Raw format: Intel 5300 CSI logs, three antennas, thirty subcarriers, 30Hz
- Scope used: the seven subjects holding all sixteen activities at thirty repetitions,
  3,361 trials, 17,356 windows
- Licence: the repository carries no licence file. This note is a re-measurement for research
  citation and is not used as a performance claim for any commercial product. Commercial use
  would require re-measurement on a dataset with an explicit permissive licence.
- Measurement status: every figure is a real measurement on public data. Nothing is simulated
  or estimated.
- Compute: one laptop. No capture hardware was used.
- Fixed random seed, seven repetitions, training fraction 6/7 identical across protocols.

Negative results are reported as they are. Cross-subject accuracy of our pipeline is at chance,
and that fact is the central evidence of this note.

## References

1. Guo, L., Wang, L., Liu, J., Zhou, W. "A Survey on Motion Detection Using WiFi Signals."
   Proc. IEEE MSN. (source of the WiAR dataset)
2. Halperin, D., Hu, W., Sheth, A., Wetherall, D. "Tool Release: Gathering 802.11n Traces
   with Channel State Information." ACM SIGCOMM CCR. (Intel 5300 CSI tool and log format)
3. Yang, J., Chen, X., Zou, H., Wang, D., Xu, Q., Xie, L. "SenseFi: A Library and Benchmark
   on Deep Learning for WiFi Human Sensing." Patterns, 2023. (reports wide variance in transfer
   performance across architectures on standard benchmarks)
4. Zheng, Y., Zhang, Y., Qian, K., Zhang, G., Liu, Y., Wu, C., Yang, Z. "Zero-Effort
   Cross-Domain Gesture Recognition with Wi-Fi." MobiSys (Widar3.0). (domain-invariant feature
   design that suppresses cross-domain degradation)
