import MapboxGl from "mapbox-gl/dist/mapbox-gl";
import React, { Component } from "react";
import { List } from "immutable";
import MapboxMixin from "./mixin";
import ReactMixin from "react-mixin";

@ReactMixin.decorate(MapboxMixin)
export default class Marker extends Component {
  static propTypes = {
    coordinates: React.PropTypes.instanceOf(List).isRequired,
    sourceName: React.PropTypes.string.isRequired,
    iconImage: React.PropTypes.string.isRequired,
    onClick: React.PropTypes.func,
    onHover: React.PropTypes.func,
    onOutHover: React.PropTypes.func
  };

  _listenInteraction({ sourceName, interaction, map }, e) {
    const features = map.queryRenderedFeatures(e.point, { layers: [sourceName] });

    if (!features.length) {
        return false;
    }

    const feature = features[0];

    interaction(feature, map);

    return true;
  }

  _onMouseMove = (args, evt) => {
    const isHovering = this._listenInteraction(args, evt);
    const { onOutHover } = this.props;

    if(!isHovering && this.state.hovering) {
      this.setState({ hovering: false });
      if(onOutHover) {
        onOutHover(args.map);
      }
    }

    if(isHovering && !this.state.hovering) {
      this.setState({ hovering: true });
    }
  };

  _onMapStyleLoaded = () => {
    const { sourceName, iconImage, coordinates, onClick, onHover } = this.props;
    const { map } = this.context;

    const layer = {
      "id": sourceName,
      "type": "symbol",
      "source": sourceName,
      "layout": {
        "icon-image": iconImage
      }
    };

    const source = new MapboxGl.GeoJSONSource({
      data: {
        type: "Point",
        coordinates: coordinates.toJS()
      }
    });

    map.addSource(sourceName, source);

    map.addLayer(layer);

    if(onClick) {
      map.on("click", this._listenInteraction.bind(this, {sourceName, interaction: onClick, map}));
    }

    if(onHover) {
      map.on("mousemove", this._onMouseMove.bind(this, {sourceName, interaction: onHover, map}));
    }

    this.setState({ source });
  };

  componentWillUnmount() {
    const { sourceName } = this.props;
    const { map } = this.context;

    map.removeSource(sourceName);
    map.off("mousemove", this._onMouseMove);
    map.off("click", this._listenInteraction);
  }

  _onCoordinatesUpdated = (coordinates) => {
    this.state.source.setData({
      type: "Point",
      coordinates: coordinates.toJS()
    });
  };

  render() {
    return null;
  }
}