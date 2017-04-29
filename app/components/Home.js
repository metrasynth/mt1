// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Home extends Component {
  render() {
    return (
      <div>
        <div>
          <button
            onClick={() => {
              const { remote: { app: { playOnDownbeat, sunvox } } } = require('electron')
              sunvox.sv_load(0, '/Users/gldnspud/proj/svjs/sunvox-dll-node/sunvox_dll/resources/test.sunvox')
              playOnDownbeat(0)
            }}
          >
            Play on downbeat
          </button>
          <button
            onClick={() => {
              const { remote: { app: { stop } } } = require('electron')
              stop(0)
            }}
          >
            Stop
          </button>
        </div>
      </div>
    );
  }
}
