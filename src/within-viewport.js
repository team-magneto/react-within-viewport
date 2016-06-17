import React, { Component } from 'react'
import wrapDisplayName from 'recompose/wrapDisplayName'
import shallowEqual from 'recompose/shallowEqual'
import debounce from 'lodash.debounce'

const withinViewport = ({
  transform = ((inViewport) => ({ inViewport })),
  containerStyle = ({
    width: '100%',
    height: '100%',
    padding: 0,
    border: 0,
  }),
  getHeight = ((elem) => elem.getBoundingClientRect().height),
  getWidth = ((elem) => elem.getBoundingClientRect().width),
  getTop = ((elem) => elem.getBoundingClientRect().top),
  getLeft = ((elem) => elem.getBoundingClientRect().left),
  getViewportHeight = ((_window, _document) => _window.innerHeight || _document.clientHeight),
  getViewportWidth = ((_window, _document) => _window.innerWidth || _document.clientWidth),
  defaultAnswer = true,
  wait = 200,
  onViewportEnter = () => {},
  onViewportLeave = () => {},
} = {}) => (BaseComponent) => class extends Component {
  static displayName = wrapDisplayName(BaseComponent, 'withinViewport')

  state = {
    containerWidth: null,
    containerHeight: null,
    containerTopOffset: null,
    containerLeftOffset: null,
    windowWidth: null,
    windowHeight: null,
    ready: false,
  }

  componentDidMount() {
    if (window && window.addEventListener) {
      this.debouncedUpdateResize = debounce(this.updateResize, wait)
      this.debouncedUpdateScroll = debounce(this.updateScroll, wait)
      window.addEventListener('resize', this.debouncedUpdateResize)
      window.addEventListener('scroll', this.debouncedUpdateScroll)
      this.updateResize()
      this.updateScroll()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const was = this.inViewport(prevState)
    const is = this.inViewport(this.state)

    if (prevState.ready === null && is === false) { onViewportLeave() }
    if (prevState.ready === null && is === true) { onViewportEnter() }
    if (was === true && is === false) { onViewportLeave() }
    if (was === false && is === true) { onViewportEnter() }
  }

  componentWillUnmount() {
    if (window && window.removeEventListener) {
      window.removeEventListener('resize', this.debouncedUpdateResize)
      window.removeEventListener('scroll', this.debouncedUpdateScroll)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.inViewport(this.state), this.inViewport(nextState))
    )
  }

  updateResize = () => {
    const update = () => {
      const elem = this.refs.withinViewportContainer

      const newState = {
        containerWidth: getWidth(elem),
        containerHeight: getHeight(elem),
        windowWidth: getViewportWidth(window, document),
        windowHeight: getViewportHeight(window, document),
      }

      this.setState({ ...newState, ready: this.isReady({ ...this.state, ...newState }) })
    }

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => update())
    } else {
      update()
    }
  }

  updateScroll = () => {
    const update = () => {
      const elem = this.refs.withinViewportContainer

      const newState = {
        containerTopOffset: getTop(elem),
        containerLeftOffset: getLeft(elem),
      }
      this.setState({ ...newState, ready: this.isReady({ ...this.state, ...newState }) })
    }

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => update())
    } else {
      update()
    }
  }

  isReady = (state = this.state) => (
    state.containerWidth !== null &&
    state.containerHeight !== null &&
    state.containerTopOffset !== null &&
    state.containerLeftOffset !== null &&
    state.windowHeight !== null &&
    state.windowWidth !== null
  )

  inViewport = (state = this.state) => {
    if (state.ready) {
      return (
        (
          state.containerTopOffset < 0 &&
          (state.containerHeight + state.containerTopOffset) > 0
        ) ||
        (
          state.containerTopOffset >= 0 &&
          state.containerTopOffset < state.windowHeight
        )
      ) &&
      (
        (
          state.containerLeftOffset < 0 &&
          (state.containerWidth + state.containerLeftOffset) > 0
        ) ||
        (
          state.containerLeftOffset >= 0 &&
          state.containerLeftOffset < state.windowWidth
        )
      )
    }
    return defaultAnswer
  }

  render() {
    return (
      <div
        ref={'withinViewportContainer'}
        style={containerStyle}
      >
        <BaseComponent
          {...transform(this.inViewport())}
          {...this.props}
        />
      </div>
    )
  }
}

export default withinViewport
