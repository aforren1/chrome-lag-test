library(data.table)
library(ggplot2)
library(RcppSimdJson)

dat <- as.data.table(fload('data_test.json'))

# this is a very slow way to do this
trial <- 0
for (i in 1:nrow(dat)) {
  if (dat[i, sample_counter] == 0) {
    trial <- trial + 1
  }
  
  dat[i, 'trial'] <- trial
}

dat[, dphoto := photo - shift(photo)]
dat[, time_us_norm := time_us - time_us[1], by = trial]

# drop first "trial"
dat <- dat[trial != 1]

# look at the raw traces
ggplot(dat, aes(x = sample_counter, y = photo)) + geom_line() +
  facet_wrap(~trial)

# for each trial, find first sample where Δphoto > some threshold (5?)
dat[, first_thresh := min(which(dphoto > 5)) - 1, by=trial]

# it looks like the MCU timing is pretty solid, so the sample
# index should directly correspond to time ()
times <- dat[, .(photo_onset = first_thresh[1]), by=trial]

# 
table(times$photo_onset)

