library(data.table)
library(ggplot2)
library(RcppSimdJson)

theme_set(theme_bw())
load_trace <- function (filename) {
  dat <- as.data.table(fload(filename))

  dat[, trial := cumsum(sample_counter==0)]
  dat[, dphoto := photo - shift(photo)]
  dat[, time_us_norm := time_us - time_us[1], by = trial]
  
  # drop first "trial"
  dat <- dat[trial != 1]
  
  # look at the raw traces
  ggplot(dat, aes(x = sample_counter, y = photo, group=trial)) + 
    geom_vline(xintercept=seq(1/60, 6/60, 1/60)*1000, linetype='longdash',
               colour='#f8766d') +
    geom_line(alpha=0.5, size=1) +
    labs(x = 'Samples (milliseconds)', y = 'Photosensor voltage (counts)')
  
  # for each trial, find first sample where Δphoto > some threshold (5?)
  dat[, first_thresh := min(which(dphoto > 5)) - 1, by=trial]
  
  # it looks like the MCU timing is pretty solid, so the sample
  # index should directly correspond to time ()
  times <- dat[, .(photo_onset = first_thresh[1]), by=trial]
  times
}


# 
#d_105 <- load_trace('data_105.json')
d_default <- load_trace('data_default.json')
d_wait <- load_trace('data_wait.json')


