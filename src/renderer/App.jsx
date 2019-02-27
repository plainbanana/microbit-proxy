import React from 'react'
import fetch from 'isomorphic-fetch'
import storage from 'electron-json-storage';
import SerialPortWrapper from './SerialPortWrapper'
import Parameter from './component/Parameter'
import { Terminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    Terminal.applyAddon(fit);
    this.term = new Terminal()
    this.state = {
      port: null,
      ports: [],
      selected: '',
      successCnt: 0,
      errorCnt: 0,
      parameters: [{
        id: '1',
        method: 'GET',
        url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
        body: '',
        regex: '\\d+:\\d+:\\d+'
      }]
    }
    storage.get('parameters', (error, data) => {
      if (error) throw error;
      if (data.name) {
        this.setState({
          parameters: data
        })
      }
    });
    this.serial = new SerialPortWrapper()

    this.serial.on('ports', ports => {
      if (ports.length !== 0)
        this.setState({selected: ports[0].comName})
      this.setState({ports: ports})
    })
    this.serial.on('connected', port => {
      this.term.clear()
      this.setState({port: port})
      this.terminalOut("Connected")
    })
    this.serial.on('receive', txt => {
      this.handler(txt)
    })
    this.serial.on('close', () => {
      this.term.clear()
      this.setState({port: null})
      this.term.write("Disconnected.")
    })

    this.handleClick = this.handleClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.changeState = this.changeState.bind(this)
    this.terminalOut = this.terminalOut.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handler = this.handler.bind(this)
  }

  componentDidMount() {
    this.term.open(document.getElementById('TerminalContainer'))
    this.term.fit();
    this.term.write('microbit-proxy $ ')
  }

  render () {
    return (
      <div className='container'>
        <nav className="level">
          <div className="level-item has-text-centered">
            <div>
              <p className="heading">Device</p>
              <p className="title">{this.state.port ? '接続': '切断'}</p>
            </div>
          </div>
          <div className="level-item has-text-centered">
            <div>
              <p className="heading">Success</p>
              <p className="title">{this.state.successCnt}</p>
            </div>
          </div>
          <div className="level-item has-text-centered">
            <div>
              <p className="heading">Failed</p>
              <p className="title">{this.state.errorCnt}</p>
            </div>
          </div>
        </nav>
        <Parameter parameters={this.state.parameters} changeState={this.changeState} />
        <div id='ConnectionSelector'></div>
        <div id='TerminalSection'>
          <div id="TerminalContainer"></div>
          <form className='field' id="Connection">
            <div className='control'>
              <select className='select' name='com-port' value={this.state.selected} onChange={this.handleChange}>
                {this.state.ports.map((p, i) => {
                  return <option key={i} value={p.comName}>{p.comName}</option>
                })}
              </select> 
              <input className='button' type='button' value='Connect' onClick={this.handleClick} />
            </div>
          </form>
        </div>
        <a href="https://tfabworks.com/microbit-proxy/" target='_blank'>
          <img id='FooterLogo' src="data:image/png;base64, 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"></img>
        </a>
      </div>
    )
  }

  handleChange(e) {
    const name = e.target.name
    const value = e.target.value
    switch (name) {
      case 'com-port':
        this.setState({ selected: value })
        break;
      default:
        console.log(e)
    }
  }

  handleClick(e) {
    this.serial.connectPort(this.state.selected)
  }

  changeState(name, value) {
    this.setState({
      [name]: value
    })
  }

  async handler(str) {
    console.log(str)
    let received
    try {
      received = JSON.parse(str)
    } catch (e) {
      console.warn(e.message)
      this._error('json string is broken.')
      return
    }
    this.terminalOut(`SerialNo:${received.s.toString()} ID: ${ received.n } VALUE:${received.v.toString()}`)
    const found = this.state.parameters.find((el) => {
      return el.id == received.n
    })
    if (found === undefined) {
      console.warn(`ID:${received.n} is not set.`)
      this._error(`ID:${received.n} is not set.`)
    }
    
    const status = await fetch(found.url, {
      method: found.method,
      body: (found.method === 'POST')? received.v : undefined
    }).then(response => {
      if (!response.ok) {
        this._error(`http response error: ${response.statusText}`)
        return new Promise.resolve(new Error())
      }
      return response.text()
    })
    if (status instanceof Error) 
      return
    let txt
    if (found.regex) {
      const matches = (new RegExp(found.regex)).exec(status)
      if (matches === null)
        this._error('http response is not contains REGEX\'s text.')
      txt = matches.join("\r\n")
    } else {
      txt = status
    }

    // const send = JSON.stringify({ "n": txt, "v": received.s})
    const send = txt;
    this.serial.write(send + '\r\n')
    this.terminalOut(send)

    this.setState(before => {
      return {successCnt: before.successCnt + 1}
    })
  }

  terminalOut(str) {
    const d = new Date()
    const dateStr = d.toLocaleDateString('ja-JP')
    const timeStr = d.toLocaleTimeString('ja-JP')
    this.term.writeln(`${dateStr} ${timeStr} ${str}`)
  }

  _error(str) {
    this.setState(before => {
      return { errorCnt: before.errorCnt + 1 }
    })
    this.terminalOut(`Error: ${str}`)
  }
}
