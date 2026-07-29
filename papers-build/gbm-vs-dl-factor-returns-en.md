# Factor Return Prediction: Boosting vs Shallow Deep Learning on Small Tabular Financial Data

## Abstract

A recurring practical question in quantitative finance is deceptively
simple: on tabular financial data with only a few hundred to a few
thousand observations, should a practitioner default to gradient
boosting (GBM) or to a shallow deep-learning (DL) model? We narrow
this question to a measured comparison. Using the public Fama-French
3-factor daily series (market excess return Mkt-RF, size SMB, value
HML), we build lagged features and set up two prediction tasks,
next-day market excess return as a regression target and its sign as
a classification target, then compare a histogram-based gradient
boosting model against a one-hidden-layer multilayer perceptron (MLP)
under a strict time-ordered split. Varying the training window from
60 to 8,000 trading days and evaluating on the same fixed, most-recent
500-day window, we find that in the extreme low-data regime (60
training days) the MLP's out-of-sample R-squared collapses to -2.60,
while the GBM degrades far more gracefully to -0.07. The gap narrows
as training data grows, and by 4,000-8,000 training days the MLP's R2
(-0.09 to -0.08) modestly overtakes the GBM's (-0.13 to -0.10).
Direction-prediction accuracy stays within 46.6-52.6% across all
training sizes for both models, close to the majority-class baseline
of 49.0%, and ROC-AUC mostly sits between 0.46 and 0.55. Two
conclusions follow. First, neither GBM nor shallow DL finds a stable
signal that beats market efficiency for next-day factor direction.
Second, the two model families fail differently: GBM is the far safer
default in the small-data regime, and that advantage narrows or
reverses as data accumulates. This paper is methodology research, not
investment advice, and does not claim profitability for any live
trading strategy.

## 1. Background: why model choice diverges on small tabular financial problems

Recent tabular machine-learning literature converges on a fairly
consistent message: on structured row-and-column data, tree-based
gradient boosting ensembles remain as strong as, or stronger than,
deep learning's more expressive architectures. This gap is reported
to widen as sample counts shrink, feature scales become more
heterogeneous, and feature interactions become more local and
non-smooth. Financial factor data fits much of this profile. Daily
observations look plentiful in raw count, but the effective amount of
statistically independent information is much smaller once volatility
clustering, autocorrelation, and regime shifts are accounted for, and
once a problem is narrowed to a single strategy, sector, or emerging
factor, the usable training sample often drops to a few hundred rows.
Newly proposed factors, emerging-market universes, small-cap
subsets, and sector-restricted strategies are typical examples.

The practical difficulty is that practitioners face this choice as an
operational decision, not a theoretical one. Whether the impressive
performance deep-learning papers report on large datasets transfers
to a factor-prediction problem with 200-2,000 samples, or whether
tree-based methods remain the safer default in that regime, is a
question each practitioner has historically had to re-verify on their
own data. This paper attempts one honest answer to that question,
using a real financial factor time series rather than a generic
tabular benchmark (credit scoring, housing prices), respecting the
time-ordering constraint specific to financial data, and
systematically varying training size.

In the same spirit, this paper does not attempt to answer "which
model beats the market." Instead it focuses on a narrower and more
reproducible question one step earlier: on identical features,
identical splits, and identical metrics, how does each model family's
out-of-sample performance move as training size changes? Even if no
market-beating signal exists, this question remains valid and useful,
because if the two model families fail differently, that failure
pattern itself is a legitimate basis for model choice.

## 2. Method: GBM vs shallow DL, time-ordered splits, leakage control

### 2.1 Models

Both model families were deliberately left untuned, close to widely
used defaults, and we state explicitly that no hyperparameter was
adjusted to favor either side.

- **Gradient boosting (GBM)**: scikit-learn's
  `HistGradientBoostingRegressor` / `HistGradientBoostingClassifier`,
  a histogram-based tree-splitting implementation in the same family
  as LightGBM. Fixed at 200 boosting iterations, max depth 4, learning
  rate 0.05.
- **Shallow deep learning (DL)**: scikit-learn's `MLPRegressor` /
  `MLPClassifier` with one hidden layer of 32 units, ReLU activation,
  and L2 weight decay of 1e-3. Early stopping on a validation split
  was enabled to let the model self-regularize somewhat against
  overfitting, with a maximum of 2,000 iterations.

Both models were trained on features standardized (z-scored) using
the mean and standard deviation of the training window only; the same
scaling was then applied, unmodified, to the test window (leakage
control).

### 2.2 Time-ordered splits and leakage control

The most common methodological error on financial time series is
random cross-validation. Shuffling observations before splitting
lets future information leak into predictions of the past, which
systematically inflates out-of-sample performance. Every split in
this paper is strictly time-ordered. The most recent 500 trading days
of the full sample are held out as a fixed evaluation window, and the
window immediately preceding it is varied in size (60, 125, 250, 500,
1,000, 2,000, 4,000, 8,000 trading days) to repeat the experiment.
Training and evaluation windows never overlap in any run, and every
feature for a given date is constructed using only information dated
strictly before that date (lagged features, Section 3.2).

This design is a simplified version of walk-forward validation.
Rather than averaging over multiple overlapping evaluation windows, we
use a single fixed, most-recent evaluation window. This was a
deliberate simplification to keep compute manageable and the
experiment reproducible; the corresponding trade-off is stated
explicitly in Section 5.

### 2.3 Evaluation metrics

The regression task is scored with out-of-sample R-squared; the
classification task with accuracy and ROC-AUC. For both tasks we also
compute a trivial baseline using only training-window statistics
(predict the training-window mean for regression, predict the
training-window majority class for classification), reported in the
same tables so readers can check whether either model actually beats
the trivial baseline.

## 3. Data and experimental setup

### 3.1 Data source (real, public data)

The data used in this paper is **real, public data**, not synthetic.
The underlying series is the Fama-French 3-factor daily time series
(market excess return Mkt-RF, size premium SMB, value premium HML,
risk-free rate RF) distributed by Professor Kenneth R. French's data
library. The network environment used to run this experiment could
not reach Professor French's original server directly, so we instead
used the identical CSV file mirrored publicly on GitHub (the
`vicmarti1/Fama-French-3-Factor` repository). The file's own header
comment states it was "created by CMPT_ME_BEME_RETS_DAILY using the
202307 CRSP database," which self-documents the origin and generation
method of the underlying data. The downloaded file contains 25,543
daily observations from July 1, 1926 through July 31, 2023.

### 3.2 Feature construction (lagged, time-safe)

Since the raw data contains only three factors, we expanded the
feature space using historical lags and rolling statistics rather
than using the raw factors directly. Specifically, for each of
Mkt-RF, SMB, and HML we constructed 1-, 2-, 3-, 5-, 10-, and 20-day
lags (18 lag features), and added rolling means and rolling
volatility of Mkt-RF plus rolling means of SMB and HML over 5-, 10-,
and 20-day windows (4 features per window across 3 windows, 12
features), for 30 features in total. All rolling statistics were also
shifted to use only information available as of one day prior before
the rolling window was computed, so that same-day information could
not leak into the features. The prediction targets are the same-day
Mkt-RF value (regression) and its sign (classification, up = 1), and
since every feature is constructed from information strictly before
that date, this is structurally equivalent to a next-day prediction
problem using only information available up to yesterday. Rows with
missing values from the lag/rolling computation (the earliest 20
trading days) were dropped, leaving a final feature sample of 25,523
rows.

### 3.3 Experimental setup summary

| Item | Value |
|---|---|
| Data source | Real, Fama-French 3-factor daily, GitHub mirror |
| Observation period | 1926-07-27 to 2023-07-31 (after feature construction) |
| Number of features | 30 (18 lags + 12 rolling statistics) |
| Evaluation window | Most recent 500 trading days (fixed) |
| Training window sizes | 60 / 125 / 250 / 500 / 1,000 / 2,000 / 4,000 / 8,000 trading days |
| GBM | HistGradientBoosting, 200 trees, depth 4, learning rate 0.05 |
| DL | MLP, 1 hidden layer of 32 units, ReLU, L2=1e-3, early stopping |
| Seed | 42 (fixed) |

## 4. Results

### 4.1 Regression: GBM is far safer in the low-data regime

The table below reports out-of-sample R-squared by training size for
GBM, MLP, and the trivial training-mean baseline. All three columns
are measured, not simulated.

| Train days | R2 (GBM) | R2 (MLP) | R2 (mean baseline) |
|---|---|---|---|
| 60 | -0.074 | -2.600 | -0.003 |
| 125 | -0.295 | -0.347 | -0.005 |
| 250 | -0.120 | -0.205 | -0.009 |
| 500 | -0.156 | -0.208 | -0.006 |
| 1,000 | -0.168 | -0.219 | -0.003 |
| 2,000 | -0.167 | -0.228 | -0.002 |
| 4,000 | -0.131 | -0.089 | -0.001 |
| 8,000 | -0.096 | -0.076 | -0.001 |

The most striking result is at 60 training days. The MLP's
out-of-sample R2 is -2.60, meaning its predictions are far worse than
simply predicting the training mean. Under the same condition the
GBM degrades far more gracefully, to -0.07, a gap of nearly 35x. This
is consistent with the general expectation that shallow neural
networks overfit catastrophically with very few training samples,
while tree ensembles' split conditions are naturally more constrained
and degrade less severely.

```chart
{"id":"fig1","kind":"line","title":"Out-of-sample R2 by training size (regression, measured)","labels":["60","125","250","500","1000","2000","4000","8000"],"series":[{"name":"GBM","values":[-0.074,-0.295,-0.120,-0.156,-0.168,-0.167,-0.131,-0.096]},{"name":"MLP","values":[-2.600,-0.347,-0.205,-0.208,-0.219,-0.228,-0.089,-0.076]},{"name":"Mean baseline","values":[-0.003,-0.005,-0.009,-0.006,-0.003,-0.002,-0.001,-0.001]}],"note":"measured"}
```

This gap narrows rapidly as training data grows. At 125 training
days the difference between GBM (-0.295) and MLP (-0.347) is already
within a single order of magnitude, and, notably, at 4,000 and 8,000
training days the MLP (-0.089, -0.076) modestly overtakes the GBM
(-0.131, -0.096). It is important not to overread this: both models
remain clearly worse than the mean baseline (near -0.001) in this
regime as well. In other words, "MLP beats GBM" here means precisely
that, among two models that both underperform a trivial baseline, the
less-bad one switches to MLP, not that either model has achieved
economically meaningful predictive power.

### 4.2 Classification: direction prediction is close to a coin flip for both models

| Train days | Accuracy (GBM) | Accuracy (MLP) | Majority baseline | AUC (GBM) | AUC (MLP) |
|---|---|---|---|---|---|
| 60 | 0.470 | 0.496 | 0.490 | 0.480 | 0.483 |
| 125 | 0.502 | 0.490 | 0.490 | 0.507 | 0.483 |
| 250 | 0.526 | 0.490 | 0.490 | 0.546 | 0.475 |
| 500 | 0.516 | 0.492 | 0.490 | 0.531 | 0.485 |
| 1,000 | 0.500 | 0.488 | 0.490 | 0.504 | 0.485 |
| 2,000 | 0.468 | 0.502 | 0.490 | 0.468 | 0.504 |
| 4,000 | 0.466 | 0.524 | 0.490 | 0.462 | 0.521 |
| 8,000 | 0.484 | 0.500 | 0.490 | 0.511 | 0.518 |

Direction (up/down) prediction accuracy stays within 46.6%-52.6%
across every training size and both models, indistinguishable in
practice from the majority-class baseline (always predict up, 49.0%).
ROC-AUC is also mostly between 0.46 and 0.55, not far from 0.5
(random). The highest AUC observed is the GBM at 250 training days
(0.546), but this single value alone is not sufficient evidence of a
stable edge, since it comes from a single evaluation window (see
Section 5).

```chart
{"id":"fig2","kind":"line","title":"Direction-prediction ROC-AUC by training size (measured)","labels":["60","125","250","500","1000","2000","4000","8000"],"series":[{"name":"GBM","values":[0.480,0.507,0.546,0.531,0.504,0.468,0.462,0.511]},{"name":"MLP","values":[0.483,0.483,0.475,0.485,0.485,0.504,0.521,0.518]}],"note":"measured"}
```

Nonetheless, the same pattern observed in the regression results
appears here too. Between 250 and 1,000 training days, the GBM's AUC
(0.50-0.55) consistently leads the MLP's (0.48-0.49), and beyond
2,000 training days the MLP's AUC (0.50-0.52) catches up to or
overtakes the GBM's (0.46-0.51). The fact that the same crossover
pattern appears independently in both the regression and
classification tasks, in the same 2,000-4,000 training-day range,
suggests this may reflect a real difference in how the two model
families respond to data scale rather than pure noise. That said,
this is an observation from a single dataset and a single evaluation
window, and generalization should be treated cautiously.

## 5. Limitations and caveats

1. **Single evaluation window**: rather than the multiple overlapping
   evaluation windows typical of walk-forward validation, this paper
   uses one fixed, most-recent 500-trading-day window. This was a
   deliberate choice to keep compute manageable and the experiment
   simple, but as a result the findings may be specific to this
   particular period (roughly mid-2021 to July 2023). The average
   and variance across multiple evaluation windows were not checked
   in this paper.
2. **Models were not tuned**: both GBM and MLP were fixed at
   hyperparameters close to widely used defaults. Careful tuning of
   either model (especially the MLP's hidden-layer architecture,
   regularization strength, and learning-rate schedule) could change
   the results. The goal of this paper was not "a contest between
   the best-tuned version of each model" but observing "the tendency
   each model family shows under a reasonable default configuration."
3. **Features are simple**: 30 features built purely from lags and
   rolling statistics are modest compared to the more sophisticated
   factor models used in practice (combining momentum, valuation,
   quality, and macroeconomic indicators). The relative advantage
   between the two models could differ under a richer feature set.
4. **Absolute level of the regression results**: R2 being negative
   across every regime, and generally worse than the mean baseline,
   means this problem setup (predicting next-day market excess
   return from daily lagged factor features) found no meaningful
   predictive power beyond a trivial baseline. This is consistent
   with market efficiency, not an implementation defect in either
   model. However, we restate that the "GBM is better / MLP is
   better" comparisons in this paper are strictly comparisons of
   which model fails less, given that both largely fail.
5. **Not investment advice**: this is methodology research, not
   investment advice. It does not claim live profitability for any
   specific factor, strategy, or model. The data, code, and results
   in this paper are for research and reproducibility purposes only
   and should not be applied directly to live capital management.

## 6. Data and reproduction

- **Data**: Fama-French 3-factor daily time series (Mkt-RF, SMB, HML,
  RF). The original source is Professor Kenneth R. French's data
  library (Tuck School of Business, Dartmouth College), which is
  widely published for academic research use. This experiment
  downloaded the identical CSV
  (`F-F_Research_Data_Factors_daily.CSV`) mirrored on the public
  GitHub repository `vicmarti1/Fama-French-3-Factor` via
  raw.githubusercontent.com, rather than from the original server.
  **Caveat**: this mirror repository carries no explicit license
  file of its own. The underlying data content is French's publicly
  published academic data, so citation for research purposes is not
  a concern, but reproducers are encouraged to download directly
  from the original source (the Kenneth R. French Data Library) when
  possible. The mirror was used here only because the network
  environment running this experiment could not reach French's
  original server (dartmouth.edu) directly; this is stated explicitly
  as an access limitation, not a reliability concern for the results.
- **Data nature**: entirely **real**. No synthetic data was used.
- **Seed**: fixed at 42, used consistently for standardization, GBM,
  and MLP.
- **Reproduction steps**: (1) download the CSV above, strip the
  header comment lines, and parse dates. (2) construct features from
  1-, 2-, 3-, 5-, 10-, 20-day lags and 5-, 10-, 20-day rolling
  mean/volatility of Mkt-RF, SMB, HML. (3) hold out the most recent
  500 trading days as the evaluation window, and use the preceding
  60-8,000 trading days as the training window. (4) fit
  `HistGradientBoostingRegressor`/`Classifier` and
  `MLPRegressor`/`Classifier` (scikit-learn) on the training window
  and compute R2, accuracy, and ROC-AUC on the evaluation window.
  scikit-learn version 1.9, seed 42.

## References

1. Fama, E. F., French, K. R. (1993). Common risk factors in the
   returns on stocks and bonds. *Journal of Financial Economics*,
   33(1), 3-56.
2. Fama, E. F., French, K. R. (2015). A five-factor asset pricing
   model. *Journal of Financial Economics*, 116(1), 1-22.
3. Kenneth R. French Data Library, Tuck School of Business,
   Dartmouth College (original source of the Fama-French factor
   data).
4. Grinsztajn, L., Oyallon, E., Varoquaux, G. (2022). Why do
   tree-based models still outperform deep learning on typical
   tabular data? *Advances in Neural Information Processing
   Systems (NeurIPS) 35*.
5. Gu, S., Kelly, B., Xiu, D. (2020). Empirical asset pricing via
   machine learning. *The Review of Financial Studies*, 33(5),
   2223-2273.
6. Ke, G. et al. (2017). LightGBM: A highly efficient gradient
   boosting decision tree. *Advances in Neural Information
   Processing Systems (NeurIPS) 30*.
7. Pedregosa, F. et al. (2011). Scikit-learn: Machine learning in
   Python. *Journal of Machine Learning Research*, 12, 2825-2830.
8. `vicmarti1/Fama-French-3-Factor` (public GitHub repository,
   Fama-French 3-factor daily CSV mirror, accessed at experiment
   run time).
