/**
 * Class: OpenLayers.FeatureAgent
 * An agent that manages feature related events.
 */
OpenLayers.FeatureAgent = OpenLayers.Class({
    
    /**
     * Property: cache
     * {Object} A cache of features under the mouse.
     */
    cache: null,
    
    /**
     * Constructor: OpenLayers.FeatureAgent
     * Create a new feature agent.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map with vector layers.
     * options - {Object} Optional object with properties to be set on the agent.
     */
    initialize: function(map, options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
        this.map = map;
        if (this.map) {
            this.activate();
        }
    },
    
    /** 
     * APIMethod: activate
     * Activate the agent.
     */
    activate: function() {
        this.cache = {};
        this.map.events.on({
            click: this.onClick,
            mousemove: this.onMousemove,
            scope: this
        });
    },
    
    /** 
     * APIMethod: deactivate
     * Deactivate the agent.
     */
    deactivate: function() {
        this.cache = {};
        this.map.events.un({
            click: onClick,
            mousemove: onMousemove,
            scope: this
        });        
    },
    
    /**
     * Method: onClick
     * Listener for the click event.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    onClick: function(evt) {
        var features = this.getFeatures(evt.clientX, evt.clientY);
        // fire featureclick events
        var feature, layer, more, clicked = {};
        for (i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            layer = feature.layer;
            clicked[layer.id] = true;
            more = layer.events.triggerEvent(
                "featureclick", {feature: feature}
            );
            if (more === false) {
                break;
            }
        }
        // fire nofeatureclick events on all layers with no targets
        for (i=0, len=this.map.layers.length; i<len; ++i) {
            layer = this.map.layers[i];
            if (!clicked[layer.id]) {
                layer.events.triggerEvent("nofeatureclick");
            }
        }
    },

    /**
     * Method: onMousemove
     * Listener for the mousemove event.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    onMousemove: function(evt) {
        var features = this.getFeatures(evt.clientX, evt.clientY);
        var over = {}, newly = [], feature;
        for (var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            over[feature.id] = feature;
            if (!this.cache[feature.id]) {
                newly.push(feature);
            }
        }
        // check if already over features
        var out = [];
        for (var id in this.cache) {
            feature = this.cache[id];
            if (feature.layer && feature.layer.map) {
                if (!over[feature.id]) {
                    out.push(feature);
                }
            } else {
                // removed
                delete this.cache[id];
            }
        }
        // fire featureover events
        var more;
        for (i=0, len=newly.length; i<len; ++i) {
            feature = newly[i];
            this.cache[feature.id] = feature;
            more = feature.layer.events.triggerEvent(
                "featureover", {feature: feature}
            );
            if (more === false) {
                break;
            }
        }
        // fire featureout events
        for (i=0, len=out.length; i<len; ++i) {
            feature = out[i];
            delete this.cache[feature.id];
            more = feature.layer.events.triggerEvent(
                "featureout", {feature: feature}
            );
            if (more === false) {
                break;
            }
        }
    },
    
    /**
     * Method: getFeatures
     * Get all features at the given screen location.
     *
     * Parameters:
     * x - {Number} Screen x coordinate.
     * y - {Number} Screen y coordinate.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features at the given point.
     */
    getFeatures: function(x, y) {
        var features = [], targets = [], layers = [];
        var layer, target, feature, i, len;
        // go through all layers looking for targets
        for (i=this.map.layers.length-1; i>=0; --i) {
            layer = this.map.layers[i];
            if (layer.div.style.display !== "none") {
                if (layer instanceof OpenLayers.Layer.Vector) {
                    target = document.elementFromPoint(x, y);
                    while (target && target._featureId) {
                        feature = layer.getFeatureById(target._featureId);
                        if (feature) {
                            features.push(feature);
                            target.style.display = "none";
                            targets.push(target);
                            target = document.elementFromPoint(x, y);
                        } else {
                            // sketch, all bets off
                            target = false;
                        }
                    }
                }
                layers.push(layer);
                layer.div.style.display = "none";
            }
        }
        // restore feature visibility
        for (i=0, len=targets.length; i<len; ++i) {
            targets[i].style.display = "";
        }
        // restore layer visibility
        for (i=layers.length-1; i>=0; --i) {
            layers[i].div.style.display = "block";
        }
        return features;
    },
    
    /**
     * APIMethod: destroy
     * Clean up.
     */
    destroy: function() {
        this.deactivate();
        delete this.cache;
        delete this.map;
    },
    
    CLASS_NAME: "OpenLayers.FeatureAgent"
    
});

OpenLayers.Layer.Vector.prototype.EVENT_TYPES.push("featureover", "featureout",
    "featureclick", "nofeatureclick");