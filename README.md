# InstaStats
Drop-in [D3.js](https://d3js.org) visualisations for the [StatsNZ Time Series API Prototype](https://statisticsnz.portal.azure-api.net/docs/services/57f1bb499726321dd478b1c7/operations/57f1bb4b97263203c870fa35).

***CAUTION: The API is still very immature. This is a proof of concept and likely to break at any time.***

## Usage
Load the libraries.
```html
<link href="./css/instastats.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"></script>
<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="./lib/instastats.js"></script>
```

Make a div on your page.
```html
<div id="graph"></div>
```

Run this.
```javascript
var graph = new InstaStats({
    targ    : "#graph",
    key     : APIkey,
    subject : "crt",
    group   : "Christchurch activity by ANZSIC06 division A/S/T"
})
```

For an explorable version, run this instead.
```javascript
var graph = new InstaStats({
    targ    : "#graph",
    key     : APIkey
})
```

## Options
* ***targ***: id of div where the graph put into.
* ***key***: API key from [StatsNZ](https://statisticsnz.portal.azure-api.net/signup/).
* ***subject***: *Optional*. If provided, will replace the subject dropdown with a fixed subject which cannot be changed.
* ***group***: *Optional*. If provided, will replace the group dropdown with a fixed group which cannot be changed.

## Functions
* **.setSubject([*subjectName*])**:
Grabs group data for a given subject and populates the group dropdown box with it.

* **.setGroup([*groupName*])**:
Grabs data for a given group and renders the graph with that data.


## Demo
Demo available at the [ChewyData website](http://chewydata.com/dev/instastats/). You're welcomed to copy/paste from there but please get your own API key as that one is likely to be killed off fairly frequently.
