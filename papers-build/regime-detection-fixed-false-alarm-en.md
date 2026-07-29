# Regime Detection at a Fixed False-Alarm Rate: Bringing CFAR Discipline to Market-State Alerts

## Summary

Market-regime alerting systems are usually built around a single fixed
threshold: cross it, and the system declares a state change. This paper
measures, with a controlled synthetic experiment, how badly that naive
approach miscalibrates its actual false-alarm rate (FAR), and how closely
a CFAR-style (Constant False Alarm Rate) rule, borrowed directly from
radar signal detection, can hold FAR to an exact target instead. We
generated a 5,000-step, two-state Markov-switching volatility process
(calm versus stress regimes) with known ground truth, used a 20-step
rolling realized-volatility statistic as the detection signal, and
compared two thresholding rules. The naive rule set its threshold at the
90th percentile of the full, mixed (calm plus stress) sample, a choice
that would produce exactly a 10 percent FAR if the sample were purely
calm. In practice, extreme stress-regime observations contaminate that
quantile, and the realized FAR came out at 4.53 percent, a shortfall of
5.47 percentage points, or about 54.7 percent relative to the intended
target. The CFAR rule instead set its threshold from the empirical
quantile of the calm-only null distribution. At three target FAR levels
(1, 5, and 10 percent), the realized FAR came out at 1.02, 5.02, and
10.02 percent respectively, with calibration error of about 0.02
percentage points at every level. The same experiment measured a clear
tradeoff: tightening the target FAR increases both the miss rate and the
mean detection delay. All results here are a methodology exercise on
synthetic data; no claim is made about real markets or the profitability
of any trading strategy. This is methodology research, not investment
advice.

## 1. Background: the false-alarm problem in regime alerting

Trying to catch the moment a market flips from a calm state into a
stress state is an old problem in both quantitative research and risk
management. A common approach in practice is to fix a single absolute
threshold on a volatility or drawdown indicator, and raise an alert
whenever that threshold is crossed. The threshold itself is usually set
by eyeballing historical data until a level "feels" like it corresponds
to a crisis. The problem is that nobody typically checks how often that
fixed threshold is actually wrong, that is, what its real false-alarm
rate is.

This is structurally the same problem that radar and communications
engineers have worked on for more than half a century. When a radar
receiver tries to detect a target against a background of noise, a fixed
absolute threshold produces a false-alarm rate that swings wildly as the
noise level changes. A threshold tuned for a clear day, applied unchanged
on a rainy day, either floods the system with false alarms from rain
clutter, or, set too conservatively, misses real targets. The fix
developed for this problem is CFAR (Constant False Alarm Rate) detection:
instead of a fixed absolute threshold, the receiver estimates the local
noise statistics at every point in time and recomputes the threshold from
that estimate, so the false-alarm rate stays pinned to a chosen target
regardless of how the noise background changes.

The central claim of this paper is that market-regime alerting has
exactly the same structural problem. The volatility level of the calm
regime, the "noise floor," varies over time, while a fixed absolute
threshold does not adapt to that variation, so the realized false-alarm
rate drifts. Porting CFAR discipline over, that is, recomputing the
threshold from the calm-regime null distribution alone, should produce
an alerting system with a false-alarm rate pinned to whatever target the
operator chooses, an alert that an operator can trust to mean what it
says: "a 1 percent alert really does fire about 1 percent of the time."
That is the hypothesis this paper measures.

## 2. Method: fixed false-alarm rate (CFAR-style) versus naive thresholding

Both detectors operate on the same raw statistic: a 20-step rolling
realized volatility (the sample standard deviation of returns over a
trailing window). An alert fires whenever this statistic exceeds a
threshold.

The naive rule computes the 90th percentile of the rolling-volatility
distribution over the entire observation period, mixed calm and stress
alike, and uses that value as a fixed threshold. This mimics a common
practice of looking at several years of history and calling anything in
the top 10 percent a warning sign. The hidden assumption behind this rule
is that the distribution of the full sample is a reasonable stand-in for
the distribution of "normal," calm-regime volatility.

The CFAR rule drops that assumption. For each target false-alarm rate,
it restricts attention to the timesteps that were truly in the calm
regime, and computes the (1 minus target FAR) empirical quantile of that
subsample alone as the threshold. For example, at a 5 percent target,
the threshold is the 95th percentile of calm-regime rolling volatility.
By construction, this threshold produces a realized FAR, measured within
the calm regime, that converges exactly to the target. This is the core
trick of CFAR: because the threshold is derived purely from the noise
(calm-regime) statistics, contamination from the signal (stress-regime)
observations cannot corrupt it.

In practice, of course, which timesteps are truly calm is not known in
advance. This experiment uses the ground-truth regime labels directly in
order to measure the methodology's upper bound, not a deployable
implementation. A real deployment would need to approximate the
calm-only subsample with a rolling window or a robust statistic (median,
MAD) over recent history, and how much that approximation erodes CFAR's
theoretical precision is outside the scope of this paper. Section 5
revisits this limitation.

Four detectors were evaluated on identical footing: the naive threshold,
and three CFAR thresholds at target FARs of 1, 5, and 10 percent. Three
metrics were measured:

- Realized false-alarm rate: the fraction of truly calm timesteps at
  which an alert fired
- Detection delay: the number of steps from the true onset of a stress
  episode to the first alert within that episode (an episode with no
  alert within 60 steps is counted as missed)
- Miss rate: the fraction of stress episodes with no alert within 60
  steps

## 3. Data and experimental setup

All time series used in this experiment were generated locally and are
entirely synthetic; no real market data was used. Regimes were generated
from a two-state Markov chain (calm equals 0, stress equals 1), with a
per-step transition probability from calm to stress of 0.005 (mean
duration about 200 steps) and from stress to calm of 0.04 (mean duration
about 25 steps). Returns within each regime were drawn from an
independent normal distribution: the calm regime has mean 0.0002 and
standard deviation 0.006, while the stress regime has mean negative
0.0010 and standard deviation 0.028, roughly 4.7 times the calm
volatility.

The full simulation ran for 5,000 steps with a fixed random seed of
20260729. The first 50 steps were excluded from all statistics as a
burn-in period, since the rolling window had not yet filled. In the
generated sample, 4,505 steps were truly calm and 495 truly stress,
grouped into 22 distinct stress episodes (contiguous runs of the stress
state). The detection statistic used throughout was the raw 20-step
rolling sample standard deviation of returns, with no additional
normalization or smoothing.

This setup is deliberately simple. No attempt was made to reproduce
real-market features such as volatility clustering, heavy tails, or
asymmetric shocks. The goal was to measure, in the cleanest possible
setting, whether CFAR discipline can hold the false-alarm rate to a
calculable target when two well-defined distributions are mixed. Section
5 and Section 6 discuss extensions toward more realistic return
distributions, such as Student-t regimes with heavy tails.

## 4. Results

### 4.1 Calibration: target versus realized false-alarm rate

The table below reports each rule's threshold, realized false-alarm
rate, and calibration error against its target. For the naive rule, the
"target" column reports the implicit target (10 percent) that the 90th
percentile threshold would achieve if applied to a purely calm sample.

| Rule | Threshold | Target FAR | Realized FAR | Error (pp) |
|---|---|---|---|---|
| Naive P90 (full sample) | 0.01762 | 10% (implicit) | 4.53% | -5.47pp |
| CFAR target 1% | 0.02529 | 1% | 1.02% | +0.02pp |
| CFAR target 5% | 0.01642 | 5% | 5.02% | +0.02pp |
| CFAR target 10% | 0.00813 | 10% | 10.02% | +0.02pp |

```chart
{"kind":"bar","title":"Target vs realized false-alarm rate (percent, measured)","labels":["Naive P90 (implicit 10)","CFAR target1","CFAR target5","CFAR target10"],"series":[{"name":"Target FAR (%)","values":[10,1,5,10]},{"name":"Realized FAR (%)","values":[4.53,1.02,5.02,10.02]}]}
```

The reason the naive threshold drifts off target is visible directly in
the sample it is computed from. When computing the 90th percentile over
the full sample, the extreme volatility observations from the stress
regime push the upper quantile band upward. The resulting threshold is
higher than it would be if computed on a purely calm sample, and the
share of calm-regime observations that exceed this inflated threshold,
the realized FAR, falls well short of the intended 10 percent, landing
at 4.53 percent instead. This is a textbook case of the signal (stress)
contaminating the noise (calm) estimate, essentially the same phenomenon
that radar CFAR literature calls target masking of the noise estimate.
The CFAR rule sidesteps this contamination path entirely by computing its
threshold from the calm regime alone, which is exactly why its
calibration error stayed within about 0.02 percentage points at all
three target levels: that precision is not a coincidence, it is a direct
consequence of the design difference.

### 4.2 The delay-versus-miss-rate tradeoff

Setting a lower target false-alarm rate raises the threshold, and a
higher threshold means true stress episodes are detected later, or
sometimes missed altogether. The table and figure below measure that
tradeoff directly.

| Rule | Mean delay (steps) | Median delay (steps) | Miss rate | Episodes detected |
|---|---|---|---|---|
| Naive P90 | 10.94 | 7.5 | 18.2% (4/22) | 18/22 |
| CFAR target 1% | 18.46 | 15.0 | 40.9% (9/22) | 13/22 |
| CFAR target 5% | 8.32 | 7.0 | 13.6% (3/22) | 19/22 |
| CFAR target 10% | 4.86 | 1.5 | 0.0% (0/22) | 22/22 |

```chart
{"kind":"bar","title":"Mean detection delay and miss rate by rule (measured)","labels":["Naive P90","CFAR target1","CFAR target5","CFAR target10"],"series":[{"name":"Mean detection delay (steps)","values":[10.94,18.46,8.32,4.86]},{"name":"Miss rate (%)","values":[18.2,40.9,13.6,0.0]}]}
```

Raising the target FAR from 1 to 10 percent shortens the mean detection
delay from 18.46 to 4.86 steps, and drops the miss rate from 40.9 percent
to 0 percent. This matches intuition exactly, and it makes an important
point clear: CFAR discipline is not a free lunch. What it offers is not
faster or more accurate detection by itself, but the ability for an
operator to choose the tradeoff between false-alarm rate and detection
speed quantitatively and predictably. Under the naive rule, adjusting the
threshold did not let an operator predict how the realized FAR would
move (Section 4.1); under CFAR, choosing a target FAR fixes the detection
delay and miss rate to values close to those in the table, which matters
more in practice than the raw detection performance itself.

Interestingly, the naive P90 rule's detection performance (delay 10.94
steps, miss rate 18.2 percent) happens to fall between the CFAR 1 percent
and CFAR 5 percent rows. This means the naive threshold happened to land
somewhere usable, not that the naive approach is safe. Its actual
false-alarm rate (4.53 percent) was completely different from what the
operator originally intended (10 percent), and there was no way for the
operator to know this in advance. The value CFAR brings is not primarily
better detection performance, it is that an operator can state, before
deployment, "this alert will produce approximately X percent false
alarms," and be right. That is calculability and explainability, not
raw accuracy.

## 5. Limitations and caveats

This experiment idealized several conditions in order to measure a
methodological upper bound, and those simplifications set clear limits
on external validity.

First, the CFAR threshold calculation used the true regime labels
directly. A real deployment cannot know in advance which timesteps are
calm, so it would need to approximate the calm subsample using a rolling
window or a robust statistic (for example, a trailing median and MAD).
How much this approximation error would erode the roughly 0.02
percentage-point calibration precision measured in Section 4.1 was not
measured here, and is a natural next experiment.

Second, the regime-generating process is a simple, normally distributed
two-state Markov chain. Real financial time series exhibit heavy tails,
volatility clustering, leverage effects, and often three or more latent
regimes, none of which this experiment captures. Under a heavy-tailed
distribution (for example, Student-t regimes), the extreme values within
the calm regime itself would be larger, which would push the CFAR
threshold higher as well; the effect on detection delay under that
condition needs separate verification.

Third, this experiment used no real market data whatsoever. The
advantage of synthetic data is that the ground truth, the true regime
label, is known, which makes it possible to measure false-alarm rate and
detection delay exactly. The cost is that it captures none of the
microstructure noise, trading halts, or liquidity shocks that real
markets exhibit. Applying the same methodology to public index or
single-name data is the natural next step.

Fourth, and most importantly, this is methodology research, not
investment advice. This paper offers a way to design regime-alerting
systems whose false-alarm rate is calculable and controllable; it makes
no claim about the profitability of any trading strategy or asset
allocation. Independent verification and risk-management review are
required before any of this is used for real trading decisions.

## 6. Data and reproducibility

Every number in this paper was computed directly from synthetic data
generated locally using the parameters below. No external dataset or API
call was used.

- Data type: synthetic, two-state Markov-switching volatility process
- Seed: 20260729
- Total steps: 5,000 (4,950 valid after excluding the 50-step burn-in)
- Calm regime (state 0): transition probability 0.005/step (mean
  duration about 200 steps), return mean 0.0002, standard deviation
  0.006
- Stress regime (state 1): transition probability 0.04/step (mean
  duration about 25 steps), return mean -0.0010, standard deviation
  0.028
- Detection statistic: 20-step rolling sample standard deviation
  (realized volatility)
- Detection-delay cap: an episode with no alert within 60 steps of onset
  is counted as missed
- Stress episodes observed: 22
- Runtime: Python 3.12.8, numpy 2.4.6

Re-running the same script with the same seed and parameters reproduces
every number reported in this paper (thresholds, realized FAR, detection
delay, miss rate) to the same decimal precision. There are no licensing
concerns: the experiment is fully reproducible from its own random-number
generator and parameters, and no third-party dataset licensing
restrictions apply.

## References

1. Finn, H. M., Johnson, R. S. (1968). Adaptive detection mode with
   threshold control as a function of spatially sampled clutter
   estimation. RCA Review, 29, 414-464. (The origin of cell-averaging
   CFAR.)
2. Hamilton, J. D. (1989). A new approach to the economic analysis of
   nonstationary time series and the business cycle. Econometrica,
   57(2), 357-384.
3. Ang, A., Timmermann, A. (2012). Regime changes and financial markets.
   Annual Review of Financial Economics, 4(1), 313-337.
4. Rohling, H. (1983). Radar CFAR thresholding in clutter and multiple
   target situations. IEEE Transactions on Aerospace and Electronic
   Systems, AES-19(4), 608-621.
