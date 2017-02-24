# Yarik parser v 0.0.3

Parses .xlsx file and creates .plist file.

Select which file to parse in ```./config.js```

**temporarly accepts only .xlsx files**

All nodes should be marked:

Question node |QXXX| where
- XXX - question ID (stepID), accepts [001-999]

Final question node |QXXX?FY| where
- XXX - question ID, accepts [001-999]
- Y - final win (T) or lose (F) node, accepts [T|F]

Answer node |QXXX:Y:QZZZ| where
- XXX - parent question ID, accepts [001-999]
- Y - answer number, accepts [1-9]
- ZZZ - next step question ID, accepts [001-999]
