#!/usr/bin/python
# -*- coding: UTF8 -*-
# @See http://www.python.org/dev/peps/pep-0263/

#######
# ABOUT
#######

# Fire location analysis

########
# AUTHOR
########

# Teemo Tebest (teemo.tebest@gmail.com)

#########
# LICENSE
#########

# CC-BY-SA 4.0 EBU / Teemo Tebest

#######
# USAGE
#######

# python 2020-australiafires.py

# Load the Pandas libraries with alias pd.
import pandas as pd

# Import glob for reading files.
import glob

# Combine files.
# https://stackoverflow.com/questions/20906474/import-multiple-csv-files-into-pandas-and-concatenate-into-one-dataframe
all_files = glob.glob('../data/2003-01-01_2020-01-06/*.csv')
# all_files = glob.glob('../data/2019-07-01_2020-01-06/*.csv')
li = []
df_from_each_file = (pd.read_csv(f) for f in all_files)
df = pd.concat(df_from_each_file, ignore_index=True)

# Create a date object.
df['date'] = pd.to_datetime(df['acq_date'])

# Remove year 2020.
# df = df.drop(df[(df['date'].dt.year == 2020)].index)

# Create data.
data = {}
year_start = 2004
year_end = 2019
for month_idx in range(0, 12, 1):
  print month_idx
  data[month_idx] = {}
  df_month = df.loc[df['date'].dt.month == (month_idx + 1)]
  for year in range(year_start, (year_end + 1), 1):
    df_month_year = df_month[df_month['date'].dt.year == year]
    data[month_idx][year] = df_month_year[['longitude', 'latitude']].values.tolist()

import json
with open('../media/data/data.json', 'w') as outfile:
  json.dump(data, outfile)

# Group the number of fires per year and month.
# https://stackoverflow.com/questions/52182967/python-pandas-group-by-date-and-count
# df1 = df.groupby([df['date'].dt.year.rename('year'), df['date'].dt.month.rename('month')]).size().reset_index(name='Count')

# https://datatofish.com/export-dataframe-to-csv/
# df1.to_csv(r'export.csv')
