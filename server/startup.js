Meteor.startup(function(){
  Knowledge.remove({})
  Work.remove({})

  var workJson = EJSON.parse(Assets.getText("work.json"));
  workJson.work.forEach(function(o) {
    Work.insert(o);
  })

  var kJson = EJSON.parse(Assets.getText("knowledge.json"));

  // Make list of "pre"-nodes
  for (var c in kJson) {
    console.log(c)
    kJson[c].forEach(function(o) {
      console.log(o.name)
      o.category = c;
      Knowledge.insert(o);
    });
  }

});
