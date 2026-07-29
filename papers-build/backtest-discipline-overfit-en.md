# Backtest Discipline: Three Traps That Inflate Performance

## Abstract

A backtest that looks great and then falls apart in live trading is
usually not evidence that the market changed regime. Far more often
it is evidence that the backtest itself contains a structural flaw
that inflates apparent performance. This paper isolates three of the
most commonly cited inflation mechanisms, look-ahead bias,
survivorship bias, and multiple-testing-driven data snooping, in
controlled experiments and measures how large the resulting illusion
is. Every experiment runs on synthetic random-walk price series
(geometric Brownian motion, GBM) generated locally; no real market
data was used, and the goal is not to claim any trading strategy is
profitable but to make the inflation mechanisms themselves visible
as numbers. A single same-bar look-ahead bug alone pushed the
annualized Sharpe ratio to roughly 21.1; lagging the signal by one
day, the honest version, brought it down to 0.07. A full universe
that honestly includes random delistings produced a mean five-year
CAGR of 10.1%, while a survivors-only backtest built from today's
constituent list on the same data produced 13.9%, a 3.8 percentage
point inflation. Scanning more random moving-average-crossover
parameter combinations on the same single series, from 5 up to
2,000, smoothly raised the best in-sample Sharpe ratio from 0.34 to
0.90, while the exact same chosen strategy, evaluated strictly
out-of-sample, stayed near a noise floor of zero (-0.07 to 0.17)
across every trial count. These results are a methodology
demonstration and not investment advice. No claim is made about the
profitability of any real trading strategy, and every number in this
paper comes from synthetic data.

## 1. Background: Backtests Fail in Practice Because of Method, Not Markets

Anyone who has built a quantitative trading strategy has seen this
scene. A backtest window shows an elegant equity curve with a Sharpe
ratio above 2. The strategy goes live, a few months pass, and the
curve is nowhere to be found. The most common explanation offered is
"the market regime changed." Regimes genuinely do shift. But a
substantial share of the performance collapse observed in practice
comes from something far more mundane and far more fixable: a
structural flaw baked into how the backtest itself was constructed.

The distinction matters because the remedy is completely different.
If a regime shift caused the collapse, the answer is a harder
problem: a more robust model, more data, better risk management. If
a methodological flaw caused it, the answer is comparatively simple:
confirm that every signal only uses information that was actually
knowable at that point in time, recompute using the full universe
that existed back then rather than today's survivors, and count how
many parameter combinations were tried so that count can be
statistically corrected for. The difficulty is that these flaws
mostly hide quietly inside backtest code. The code runs without
error, the numbers look plausible, and nothing warns the researcher
that a flaw is present.

This paper picks three of the flaws most frequently cited in both
academic and practitioner literature, look-ahead bias, survivorship
bias, and multiple testing, and isolates each in its own controlled
experiment. Mixing all three into one experiment would make it
impossible to tell how much each contributed, so each is
deliberately demonstrated on separate synthetic data that does not
interact with the others. None of the three experiments uses real
tickers or real market data. Each uses a pure random walk generated
with numpy, whose true expected return and true volatility we set
ourselves. Knowing the "right answer" in advance is exactly why
synthetic data is useful here: with real market data there is no way
to know the ground truth, so there is no way to isolate how much a
given backtesting method distorts it. With data whose generating
process we control, that isolation becomes possible.

## 2. Three Inflation Mechanisms

### 2.1 Look-Ahead Bias: Code That Peeks at the Future

Look-ahead bias covers every case where a backtest's signal
calculation uses information that did not yet exist at that point in
time. The most blatant form is an indexing bug that accidentally
uses the same bar's closing price for both the signal and the return
it is scored against. Implement "go long today if today's close is
above yesterday's, short if below" as a vectorized rule without
care, and the information deciding the signal (today's close) arrives
at the exact same moment as the return the signal is scored on (also
measured from today's close). The rule is effectively "know whether
today will go up or down and enter in that direction before it
happens", an access to information that is impossible in live
trading but appears naturally the moment an array index is off by
one. Subtler forms include using a financial statement's fiscal
period-end date instead of its actual public release date, using
vendor data that has since been revised as if it were the
originally observed value, or assuming fills at the exact closing
price with no slippage. What all of these share is that information
the market did not yet have leaks into the backtest.

### 2.2 Survivorship Bias: Dead Tickers Quietly Disappear from the Data

Survivorship bias is a problem with how the universe itself is
defined: it is built with the benefit of hindsight already baked in.
Most market data vendors provide a list of tickers that are still
trading today. Names that were delisted, acquired, or went bankrupt
are quietly absent from that "current constituents" list. When an
analyst takes that current list and runs a backtest five years into
the past, the hundreds of names that existed during that period but
no longer exist today are simply missing from the calculation. This
is not a random omission. The names that disappeared are
systematically concentrated among the worst performers, because
bankruptcy and delisting do not happen to companies that are doing
well. The result is that a survivors-only average return is always
biased upward relative to what an investor who actually held that
market at the time would have earned. This mechanism has long been
documented in mutual fund performance research (Brown, Goetzmann,
Ibbotson & Ross, 1992), and the same mechanism operates identically
in single-stock backtests.

### 2.3 Multiple Testing: Try Enough Things and Something Will Look Good by Chance

Multiple testing, commonly called data snooping, is different in
kind from the first two. Look-ahead bias and survivorship bias are
coding mistakes; multiple testing happens even when every line of
code is correct. The failure is not counting how many things were
tried. Scan only five moving-average-crossover parameter
combinations on a single price series and one might happen to look
good in-sample by chance; scan 2,000 and something spectacular-looking
is almost guaranteed to appear. This is not because the series
actually contains that pattern, but purely because the parameter
search picked out whichever combination happened to be luckiest
within the sample's own noise. If 2,000 people each flip a coin 100
times, a handful of them will see an astonishing run of 15 heads in
a row. That person has no special coin-flipping skill; the extreme
outcome is guaranteed to appear somewhere once enough people try.
Parameter scanning in a backtest has the exact same structure. As
the number of trials N grows, the expected value of "the best
in-sample result" keeps growing even when there is zero true effect
anywhere in the data. Reporting only that single best result as a
"discovered strategy" without correcting for how many trials
produced it is exactly what inflates performance through multiple
testing (Bailey, Borwein, Lopez de Prado & Zhu, 2014).

## 3. Experimental Setup: Isolating Each Mechanism on Synthetic Series

All three experiments run on synthetic price series generated
locally with numpy alone; none uses real market data or any network
call. Each experiment repeats across 30 independent random seeds,
and both the mean and standard deviation are reported.

**Look-ahead experiment.** A 1,000-trading-day price path is drawn
from a geometric Brownian motion with 6% annualized expected return
and 20% annualized volatility. The buggy strategy uses that day's
own return sign as that day's position (position = sign(today's
return), pnl = position times today's return), which requires
knowing today's close before it happens; multiplying a return by its
own sign always yields the absolute value of that return, so losses
are structurally impossible. The fixed strategy uses yesterday's
return sign as today's position (position = sign(yesterday's
return)). This is an executable backtest, but a pure random walk has
no autocorrelation, so no genuine edge is expected from it.

**Survivorship experiment.** 500 independent stocks are simulated
over five years (1,260 trading days). Each stock's annualized
expected return is drawn from a distribution with mean 6% and
cross-sectional standard deviation 12%; annualized volatility is
fixed at 28% for all. Any stock whose drawdown from its own running
peak exceeds 60% faces a 1% daily probability of delisting, and once
delisted its price is frozen permanently at that level (an
unrecoverable loss). The full-universe calculation holds all 500
stocks equal-weighted from day one through the final day. The
survivors-only calculation keeps only the subset still listed at the
end and rebuilds an equal-weighted portfolio from just that subset,
mimicking the common practice of backtesting with a data vendor that
only supplies today's constituent list.

**Multiple-testing experiment.** A zero-drift (0% annualized expected
return, 20% annualized volatility) random walk of 1,200 trading days
is split into an in-sample segment (the first 60%, 720 days) and an
out-of-sample segment (the remaining 40%, 480 days). N random (fast
moving average, slow moving average) parameter pairs are drawn
(N = 5, 20, 100, 500, 2,000), each pair's in-sample Sharpe ratio is
computed, and the single best-performing pair is selected. That
exact same parameter pair is then applied unchanged to the
out-of-sample segment to measure how it actually performs. The true
expected return was fixed at exactly zero by design so that the
ground truth is known in advance; the experiment measures how
convincing an in-sample result can be "discovered" in a series with
no real edge whatsoever. Two corrections are applied jointly. The
first is a Bonferroni-style correction that divides the single-test
significance level of 0.05 by the number of trials N, a
conservative adjustment. The second is the deflated Sharpe ratio
(DSR) proposed by Bailey and Lopez de Prado (2014), which uses an
extreme-value approximation to estimate the "best Sharpe ratio"
expected under the null across N independent trials, then converts
how far the observed best Sharpe ratio exceeds that baseline into a
standard normal probability.

## 4. Results

### 4.1 Look-Ahead Bias: A Single Index Shift Produces a 21x Illusion

The buggy strategy using same-bar information averaged an annualized
Sharpe ratio of 21.1 (standard deviation 0.59) across the 30 seeds.
No real strategy achieves anything close to this; the value exists
only because the design makes losses structurally impossible.
Lagging the signal by one honest day drops the mean Sharpe ratio to
0.069 (standard deviation 0.49), scattered noise around zero,
exactly consistent with the fact that a random walk has no genuine
autocorrelation to exploit. Comparing the two in CAGR terms is even
more dramatic: the buggy strategy's mean CAGR was 1,132% (an 11.3x
annual multiple), and the fixed strategy's mean CAGR was -0.15%,
essentially exactly zero.

```chart
{"kind":"bar","title":"Annualized Sharpe: same-bar bug vs one-day lag (fixed)","labels":["Same-bar info (bug)","One-day lag (fixed)"],"values":[21.14,0.07]}
```

The implication is simple: look-ahead bias is not a matter of degree,
it is a matter of existence. Once same-time information contaminates
both the signal and the return it is scored against, the illusion can
be a 21x inflation or a 1.3x inflation depending on how much
contamination occurs. Real-world look-ahead bugs are rarely this
blatant; they typically shift the index by hours rather than a full
day, or by the length of a single delayed filing. The subtler the
form, the harder it is to catch, and until it is caught it produces
a backtest result that reads as entirely honest.

### 4.2 Survivorship Bias: Counting Only Survivors Erases 3.8 Percentage Points

Across the 500-stock simulation, an average of 101.5 stocks (about
20.3%) were delisted over the five years. The full-universe mean
CAGR, honestly including the realized losses of delisted names, was
10.1% (standard deviation 0.94 percentage points). The
survivors-only mean CAGR, recomputed using only the 398.5 names still
listed at the end, was 13.9% (standard deviation 0.98 percentage
points). The gap between the two, the pure illusion created by
survivorship bias, is 3.8 percentage points per year.

```chart
{"kind":"bar","title":"Five-year CAGR: full universe vs survivors-only","labels":["Full universe","Survivors only"],"values":[0.1009,0.1390]}
```

3.8 percentage points may look small, but it compounds annually over
multiple years. Assuming a 20-year holding period, the gap between a
10.1% and a 13.9% CAGR compounds into roughly double the final
portfolio value. What matters more is how the delisting probability
was designed: it was tied directly to drawdown, so poorly performing
stocks were more likely to be delisted. This is exactly the direction
delisting, acquisition, and bankruptcy occur in real markets.
Thriving companies rarely get delisted suddenly; companies whose
fundamentals have collapsed are delisted overwhelmingly more often.
So filtering to survivors is not a random omission but a systematic
removal of the worst observations, and that directionality is what
determines the size of the bias.

### 4.3 Multiple Testing: In-Sample Performance Keeps Climbing, True Performance Does Not

The multiple-testing results are summarized below. The best
in-sample Sharpe ratio rises smoothly as the number of trials N
grows, while the exact same chosen strategy's out-of-sample Sharpe
ratio stays near zero across all five trial counts.

| Trials N | Best in-sample Sharpe (ann.) | Matched out-of-sample Sharpe (ann.) | Expected best Sharpe under null | Naive p-value | Bonferroni rejection rate (5%) | DSR "no skill" probability |
|---|---|---|---|---|---|---|
| 5 | 0.34 | 0.17 | 0.71 | 0.316 | 0.0% | 0.694 |
| 20 | 0.61 | 0.09 | 1.12 | 0.196 | 0.0% | 0.767 |
| 100 | 0.78 | -0.04 | 1.50 | 0.138 | 0.0% | 0.840 |
| 500 | 0.85 | 0.01 | 1.81 | 0.114 | 0.0% | 0.911 |
| 2,000 | 0.90 | -0.07 | 2.04 | 0.103 | 0.0% | 0.946 |

```chart
{"kind":"line","title":"Best in-sample vs matched out-of-sample Sharpe by trial count N","labels":["5","20","100","500","2000"],"series":[{"name":"Best in-sample (ann.)","values":[0.34,0.61,0.78,0.85,0.90]},{"name":"Matched out-of-sample (ann.)","values":[0.17,0.09,-0.04,0.01,-0.07]}]}
```

Three things need to be read together for this table to make sense.
First, the best in-sample Sharpe ratio rises from 0.34 at N=5 to
0.90 at N=2,000, nearly a threefold increase. Because the true
expected return of this series was fixed at exactly zero by design,
this increase reflects no improvement in any strategy; it is purely
the effect of searching harder and having more chances to stumble
onto something that looks good by luck. Second, the exact same
parameter pair, evaluated out-of-sample, stays within a noise band
of -0.07 to 0.17 regardless of N. Out-of-sample performance not
improving alongside N means the "edge" found in-sample transfers to
the out-of-sample period not at all. Third, a naive significance
test that ignores how many trials were run (a single-test 5%
threshold) calls the result "statistically significant" increasingly
often as N grows, from 6.7% of seeds up to 46.7%, exactly the failure
pattern multiple-testing theory predicts. The Bonferroni correction
(dividing the significance threshold by N) and the deflated Sharpe
ratio, by contrast, hold their rejection rate at 0% across every
value of N, correctly identifying that this data was constructed
with zero true edge. The DSR's "no skill" probability also rises
from 0.69 to 0.95 as N grows, exactly quantifying the intuition that
an observed best result should be treated more skeptically the more
trials produced it.

## 5. A Practical Checklist: The Minimum Procedure to Guard Against All Three

What all three experiments point toward is not a sophisticated new
technique but a boring procedure. Checking the following items when
reviewing a backtest catches most instances of all three inflation
mechanisms.

- **Guarding against look-ahead bias.** Explicitly verify that the
  index used to compute a signal differs from the index used to
  compute the return it is scored against. Use a financial
  statement's actual public release date, never its fiscal
  period-end date. If vendor data has since been revised, keep a
  separate point-in-time copy of what was actually observable at
  that moment rather than the later-revised value. Building a
  hard-coded one-bar lag layer between signal computation and return
  computation into the backtesting framework removes the possibility
  of a human accidentally shifting an index.
- **Guarding against survivorship bias.** Use a point-in-time
  universe for each date rather than a vendor's "currently listed"
  list. Always include the last traded price or acquisition price of
  delisted or acquired names in the final return calculation. Confirm
  at the vendor contract stage whether the provided universe is
  survivorship-bias-free; if the documentation says "current
  constituents only," assume any backtest built on that data is
  structurally biased.
- **Guarding against multiple testing.** Track the total number of
  parameter combinations, variants, and features tried from the very
  start of the research process. Re-evaluate the final reported
  Sharpe ratio against a trial-count-adjusted threshold (Bonferroni
  or deflated Sharpe ratio) rather than a single-test threshold.
  Confirm that a strategy selected in-sample is reproduced on a truly
  separate out-of-sample segment, ideally on data observed only after
  the split was fixed. Remember that repeatedly cycling between
  in-sample tuning and out-of-sample checking on the same data
  ("it didn't work out-of-sample, so let's go back and retune")
  effectively contaminates the out-of-sample segment with multiple
  testing as well.

## 6. Reproducibility

All three experiments run on numpy and scipy alone, with no external
network calls and no real market data of any kind. Each was repeated
across 30 independent random seeds, with both the mean and standard
deviation reported, and every metric (Sharpe ratio, CAGR, in-sample
and out-of-sample performance, p-value, deflated Sharpe ratio) was
computed directly by code, never self-reported by a model or agent.
All three experiments together finish in a few seconds on a laptop
CPU. The deflated Sharpe ratio implements the approximation from
Bailey and Lopez de Prado (2014) directly, and the expected best
Sharpe ratio under the null uses the extreme-value approximation
that includes the Euler-Mascheroni constant. The seeds, parameters,
and synthetic data generation process needed to reproduce every
number are all fixed in this paper's experiment script.

Every number in this paper comes from a methodology demonstration on
synthetic random-walk data, and no claim is made about the
profitability of any real trading strategy or any market forecast.
**This content is research and methodology only, and is not
investment advice.**

## References

1. Bailey, D. H., & Lopez de Prado, M. (2014). The Deflated Sharpe
   Ratio: Correcting for Selection Bias, Backtest Overfitting, and
   Non-Normality. *Journal of Portfolio Management*, 40(5).
2. Bailey, D. H., Borwein, J., Lopez de Prado, M., & Zhu, Q. J.
   (2014). Pseudo-Mathematics and Financial Charlatanism: The Effects
   of Backtest Overfitting on Out-of-Sample Performance. *Notices of
   the American Mathematical Society*, 61(5).
3. Brown, S. J., Goetzmann, W., Ibbotson, R. G., & Ross, S. A.
   (1992). Survivorship Bias in Performance Studies. *Review of
   Financial Studies*, 5(4).
4. Harvey, C. R., Liu, Y., & Zhu, H. (2016). ...and the
   Cross-Section of Expected Returns. *Review of Financial Studies*,
   29(1).
5. Aronson, D. (2006). *Evidence-Based Technical Analysis: Applying
   the Scientific Method and Statistical Inference to Trading
   Signals*. Wiley.
6. Pardo, R. (2008). *The Evaluation and Optimization of Trading
   Strategies*, 2nd ed. Wiley.
