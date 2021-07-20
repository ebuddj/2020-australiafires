import React, {Component} from 'react';
import style from './../styles/styles.less';

// https://alligator.io/react/axios-react/
import axios from 'axios';

// https://d3js.org/
import * as d3 from 'd3';

// https://github.com/d3/d3-geo-projection/
// import {geoRobinson} from 'd3-geo-projection';

// https://www.npmjs.com/package/topojson
// import * as topojson from 'topojson';


const yearStart = 2008,
      yearEnd = 2019,
      scaleMax = 2,
      scaleMin = -2,
      intervalTimeout = 10000,
      useFireSeason = false;

let monthNames = [],
    fireSeasonIdx = {},
    interval,
    year_interval,
    canvas = {},
    year_canvas;
if (useFireSeason === false) {
  monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  fireSeasonIdx = {0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,11:11};
}
else {
  monthNames = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
  fireSeasonIdx = {0:5,1:6,2:7,3:8,4:9,5:10,6:11,7:0,8:1,9:2,10:3,11:4};
}

// https://observablehq.com/@d3/mercator
const projection_small = d3.geoMercator()
                           .translate([-480,-20])
                           .scale(250);

const projection_large = d3.geoMercator()
                           .translate([-1930,-80])
                           .scale(1000);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      controls_text:'Play',
      current_year_average_temp:null,
      interval_play:false,
      month_idx:0
    }
    // Define refs.
    this.mapsContainerRef = React.createRef();
    this.yearMapContainerRef = React.createRef();
  }
  componentDidMount() {
    // Get data.
    axios.get('./data/data.json')
    .then((response) => {
      this.setState((state, props) => ({
        data:response.data
      }), this.loadMapData);
    });
  }
  componentDidUpdate(prevProps, prevState, snapshot) {

  }
  componentWillUnMount() {

  }
  loadMapData() {
    d3.json('./data/australia.json').then(data => {
      this.setState((state, props) => ({
        map_data:data
      }), this.drawMaps);
    });
  }
  value2color(value) {
    // Return color from chroma based on value.
    return f(value);
  }
  drawMaps() {
    // http://bl.ocks.org/micahstubbs/535e57a3a2954a129c13701fe61c681d
    const margin = {top: 0, right: 0, bottom: 0, left: 0};
    const width = 200 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    for (let year = yearStart; year <= yearEnd; year++) {
      const maps_container = d3.select('.' + style.maps_container);
      const map_container = maps_container.append('div').attr('class', style.map_container).attr('data-year', year);
      let self = this;
      map_container.on('click', function (d,i) {
        self.handleMapClick(this.getAttribute('data-year'));
      });
      map_container.append('div').attr('class', style.year).html(year + ((useFireSeason === false) ? '' : '–' + ((year === 2019) ? '' : (year + 1))));
      
      // Store canvas in an object so we can append the fires later.
      // https://petrichor.studio/2018/05/21/get-started-creating-d3-maps/
      // https://stackoverflow.com/questions/20488590/set-background-fill-stroke-and-opacity-of-html5-canvas
      canvas[year] = map_container.append('canvas')
                               .attr('height', height)
                               .attr('width', width);
      let context = canvas[year].node().getContext('2d');
      const geoPathGenerator = d3.geoPath().projection(projection_small).context(context);
      
      context.beginPath();
      context.fillStyle = '#eee';
      context.strokeStyle = '#eee';
      geoPathGenerator(this.state.map_data);
      context.stroke()
      context.fill();
    }
    this.toggleInterval();
  }
  toggleInterval() {
    let month_idx = this.state.month_idx;
    if (this.state.interval === true) {
      clearInterval(interval);
      this.setState((state, props) => ({
        controls_text:'Play',
        interval:false,
      }));
    }
    else {
      interval = setInterval(() => {
        for (let i = 0; i <= month_idx; i++) {
          d3.select('.' + style.month_container + '_' + i).style('color', '#eee');
        }
        this.setState((state, props) => ({
          controls_text:'Pause',
          month_idx:month_idx,
          interval:true
        }), this.setFires);
        month_idx++;
        if (month_idx > 11) {
          clearInterval(interval);
          this.setState((state, props) => ({
            controls_text:'Play',
            interval:false,
          }));
        }
      }, intervalTimeout);
    }
  }
  setFires() {
    const data = this.state.data[fireSeasonIdx[this.state.month_idx]];
    for (let year = yearStart; year <= yearEnd; year++) {
      let context = canvas[year].node().getContext('2d');
      context.fillStyle = 'rgba(226, 34, 34, 0.2)';
      if (this.state.month_idx > 6 && data[(year + 1)] && useFireSeason === true) {
        data[(year + 1)].map((lat_lng, i) => {
          const coordinates = projection_small(lat_lng);
          context.beginPath();
          context.arc(coordinates[0], coordinates[1], 0.15, 0, Math.PI * 2)
          context.fill();
        });
      }
      else {
        data[year].map((lat_lng, i) => {
          const coordinates = projection_small(lat_lng);
          context.beginPath();
          context.arc(coordinates[0], coordinates[1], 0.15, 0, Math.PI * 2)
          context.fill();
        });
      }
    }
  }
  handleYearMapClick() {
    clearInterval(year_interval)
    for (let i = 0; i <= this.state.month_idx; i++) {
      d3.select('.' + style.month_container + '_' + i).style('color', '#eee');
    }
    this.mapsContainerRef.current.style.display = 'block';
    this.yearMapContainerRef.current.style.display = 'none';
    this.setState((state, props) => ({
      month_idx:state.month_idx + 1
    }), this.toggleInterval);
  }
  handleMapClick(year) {
    clearInterval(interval);
    this.mapsContainerRef.current.style.display = 'none';
    this.yearMapContainerRef.current.style.display = 'block';

    const margin = {top: 0, right: 0, bottom: 0, left: 0};
    const width = 800 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const year_map_container = d3.select('.' + style.year_map_container);
    let self = this;
    year_map_container.on('click', function (d,i) {
      self.handleYearMapClick();
    });
    year_map_container.select('canvas').remove();
    year_map_container.select('div').remove();

    year_map_container.append('div').attr('class', style.year).html(year + ((useFireSeason === false) ? '' : '–' + ((year === 2019) ? '' : (year + 1))));
    year_canvas = year_map_container.append('canvas')
                                        .attr('height', height)
                                        .attr('width', width);
    let context = year_canvas.node().getContext('2d');
    const geoPathGenerator = d3.geoPath().projection(projection_large).context(context);
    
    context.beginPath();
    context.fillStyle = '#eee';
    context.strokeStyle = '#eee';
    context.strokeWidth = 0;
    context.lineWidth = 0;
    geoPathGenerator(this.state.map_data);
    context.stroke()
    context.fill();

    d3.selectAll('.' + style.month_container).style('color', '#666');

    this.setState((state, props) => ({
      controls_text:'Pause',
      interval:false,
      year:year,
      year_interval:false,
      year_month_idx:0
    }), this.toggleYearInterval);
  }
  toggleYearInterval() {
    let year_month_idx = this.state.year_month_idx;
    if (this.state.year_interval === true) {
      clearInterval(year_interval);
      this.setState((state, props) => ({
        controls_text:'Play',
        year_interval:false,
      }));
    }
    else {
      year_interval = setInterval(() => {
        d3.select('.' + style.month_container + '_' + year_month_idx).style('color', '#eee');
        this.setState((state, props) => ({
          controls_text:'Pause',
          year_month_idx:year_month_idx,
          year_interval:true
        }), this.setYearFires);
        year_month_idx++;
        if (year_month_idx > 11) {
          clearInterval(year_interval);
          this.setState((state, props) => ({
            controls_text:'Play',
            year_interval:false,
          }));
        }
      }, intervalTimeout);
    }
  }
  setYearFires() {
    const data = this.state.data[fireSeasonIdx[this.state.year_month_idx]];
    let context = year_canvas.node().getContext('2d');
    context.fillStyle = 'rgba(226, 34, 34, 0.2)';
    if (this.state.year_month_idx > 6 && data[(this.state.year + 1)] && useFireSeason === true) {
      data[(this.state.year + 1)].map((lat_lng, i) => {
        const coordinates = projection_large(lat_lng);
        context.beginPath();
        context.arc(coordinates[0], coordinates[1], 0.5, 0, Math.PI * 2)
        context.fill();
      });
    }
    else {
      data[this.state.year].map((lat_lng, i) => {
        const coordinates = projection_large(lat_lng);
        context.beginPath();
        context.arc(coordinates[0], coordinates[1], 0.5, 0, Math.PI * 2)
        context.fill();
      });
    }
  }

  // shouldComponentUpdate(nextProps, nextState) {}
  // static getDerivedStateFromProps(props, state) {}
  // getSnapshotBeforeUpdate(prevProps, prevState) {}
  // static getDerivedStateFromError(error) {}
  // componentDidCatch() {}
  render() {
    return (
      <div className={style.app}>
        <div className={style.months_container}>
          {
            monthNames.map((month_name, i) => {
              return (
                <div className={style.month_container + ' ' + style.month_container + '_' + i} key={i}>{month_name}</div>
              );
            })
          }
        </div>
        <div className={style.maps_wrapper}>
          <div className={style.maps_container} ref={this.mapsContainerRef}></div>
          <div className={style.year_map_container} ref={this.yearMapContainerRef}></div>
        </div>
      </div>
    );
  }
}
export default App;