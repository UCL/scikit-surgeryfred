//========================================================================
// SciKit-SurgeryFRED front end
//========================================================================
YUI().use('dial', function(Y) {

        var dial = new Y.Dial({
        min:-220,
        max:220,
        stepsPerRevolution:100,
        value: 30
        });
        dial.render('#ablation_dial');

        });
