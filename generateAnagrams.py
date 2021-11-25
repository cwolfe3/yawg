from itertools import combinations
import re
import json

words_location = '/usr/share/dict/words'
output_location = './anagrams.js'

words_file = open(words_location, 'r')
words_lines = words_file.read().splitlines()
words_file.close()

re = re.compile('^[a-z]+$')
legal_words = list(filter(lambda x: re.match(x) and 3 <= len(x) <= 8, words_lines))
legal_words = sorted(legal_words, key=lambda x: (len(x), x))  # sort by length first

ii = dict()
subgrams = dict()

for word in legal_words:
    fingerprint = ''.join(sorted(word))
    if fingerprint not in ii:
        ii[fingerprint] = []
        subgrams[fingerprint] = []
    ii[fingerprint].append(word)

added = set()
for word in legal_words:
    fingerprint = ''.join(sorted(word))

    to_search = [fingerprint]
    while to_search:
        curr = to_search.pop()
        if len(curr) < 3:
            continue
        subseqs = [''.join(list(x)) for x in combinations(curr, len(curr) - 1)]
        for subseq in subseqs:

            if subseq in ii and subseq not in subgrams[fingerprint]:
                subgrams[fingerprint].append(subseq)
            if subseq in added:
                continue
            else:
                to_search.append(subseq)
        added.add(curr)

data = dict()
data['words'] = legal_words
data['ii'] = ii
data['subgrams'] = subgrams
with open(output_location, 'w+') as output_file:
    output_file.write('export const dict = ');
    json.dump(data, output_file)
