'use strict'

import React, { Component, } from 'react';
import PropTypes from 'prop-types';
import {
  FlatList,
  StyleSheet,
  TouchableHighlight,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

// small helper function which merged two objects into one
function MergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      if (obj2[p].constructor == Object) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch (e) {
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}

export default class GiftedListView extends Component {

  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.mounted = false;
  }

  static defaultProps = {
    customStyles: {},
    initialListSize: 10,
    firstLoader: true,
    pagination: true,
    refreshable: true,
    refreshableColors: undefined,
    refreshableProgressBackgroundColor: undefined,
    refreshableSize: undefined,
    refreshableTitle: undefined,
    refreshableTintColor: undefined,
    renderRefreshControl: null,
    headerView: null,
    sectionHeaderView: null,
    scrollEnabled: true,
    withSections: false,
    onFetch(page, callback, options) { callback([]); },
    paginationFetchingView: null,
    paginationAllLoadedView: null,
    paginationWaitingView: null,
    emptyView: null,
    renderSeparator: null,
    rowHasChanged: null,
    distinctRows: null,
  }

  static propTypes = {
    customStyles: PropTypes.object,
    initialListSize: PropTypes.number,
    firstLoader: PropTypes.bool,
    pagination: PropTypes.bool,
    refreshable: PropTypes.bool,
    refreshableColors: PropTypes.array,
    refreshableProgressBackgroundColor: PropTypes.string,
    refreshableSize: PropTypes.string,
    refreshableTitle: PropTypes.string,
    refreshableTintColor: PropTypes.string,
    renderRefreshControl: PropTypes.func,
    headerView: PropTypes.func,
    sectionHeaderView: PropTypes.func,
    scrollEnabled: PropTypes.bool,
    withSections: PropTypes.bool,
    onFetch: PropTypes.func,

    paginationFetchingView: PropTypes.func,
    paginationAllLoadedView: PropTypes.func,
    paginationWaitingView: PropTypes.func,
    emptyView: PropTypes.func,
    renderSeparator: PropTypes.func,

    rowHasChanged: PropTypes.func,
    distinctRows: PropTypes.func,
  }

  _setPage(page) { this._page = page; }
  _getPage() { return this._page; }
  _setRows(rows) { this._rows = rows; }
  _getRows() { return this._rows; }

  paginationFetchingView = () => {
    if (this.props.paginationFetchingView) {
      return this.props.paginationFetchingView();
    }

    return (
      <View style={[styles.paginationView, this.props.customStyles.paginationView]}>
        <ActivityIndicator />
      </View>
    );
  };

  paginationAllLoadedView = () => {
    if (this.props.paginationAllLoadedView) {
      return this.props.paginationAllLoadedView();
    }

    return (
      <View style={[styles.paginationView, this.props.customStyles.paginationView]}>
        <Text style={[styles.actionsLabel, this.props.customStyles.actionsLabel]}>
          ~
        </Text>
      </View>
    );
  };

  paginationWaitingView = (paginateCallback) => {
    if (this.props.paginationWaitingView) {
      return this.props.paginationWaitingView(paginateCallback);
    }

    return (
      <TouchableHighlight
        underlayColor='#c8c7cc'
        onPress={paginateCallback}
        style={[styles.paginationView, this.props.customStyles.paginationView]}
      >
        <Text style={[styles.actionsLabel, this.props.customStyles.actionsLabel]}>
          Load more
        </Text>
      </TouchableHighlight>
    );
  };

  headerView = () => {
    if (this.state.paginationStatus === 'firstLoad' || !this.props.headerView) {
      return null;
    }
    return this.props.headerView();
  };

  emptyView = (refreshCallback) => {
    if (this.props.emptyView) {
      return this.props.emptyView(refreshCallback);
    }

    return (
      <View style={[styles.defaultView, this.props.customStyles.defaultView]}>
        <Text style={[styles.defaultViewTitle, this.props.customStyles.defaultViewTitle]}>
          Sorry, there is no content to display
        </Text>

        <TouchableHighlight
          underlayColor='#c8c7cc'
          onPress={refreshCallback}
        >
          <Text>
            ↻
          </Text>
        </TouchableHighlight>
      </View>
    );
  };

  renderSeparator = () => {
    if (this.props.renderSeparator) {
      return this.props.renderSeparator();
    }

    return (
      <View style={[styles.separator, this.props.customStyles.separator]} />
    );
  };

  getInitState = () => {
    this._setPage(1);
    this._setRows([]);

    var ds = null;
    if (this.props.withSections === true) {
      // ds = new ListView.DataSource({
      //   rowHasChanged: this.props.rowHasChanged ? this.props.rowHasChanged : (row1, row2) => row1 !== row2,
      //   sectionHeaderHasChanged: (section1, section2) => section1 !== section2,
      // });
      return {
        // dataSource: ds.cloneWithRowsAndSections(this._getRows()),
        dataSource: this._getRows(),
        isRefreshing: false,
        paginationStatus: 'firstLoad',
      };
    } else {
      // ds = new ListView.DataSource({
      //   rowHasChanged: this.props.rowHasChanged ? this.props.rowHasChanged : (row1, row2) => row1 !== row2,
      // });
      return {
        // dataSource: ds.cloneWithRows(this._getRows()),
        dataSource: this._getRows(),
        isRefreshing: false,
        paginationStatus: 'firstLoad',
      };
    }
  };

  componentDidMount() {
    this.mounted = true;
    this.props.onFetch(this._getPage(), this._postRefresh, { firstLoad: true });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  setNativeProps = (props) => {
    this.flatList.setNativeProps(props);
  };

  _refresh = () => {
    this._onRefresh({ external: true });
  };

  _onRefresh = (options = {}) => {
    if (this.mounted) {
      this.setState({
        isRefreshing: true,
      });
      const { dataSource } = this.state
      dataSource && dataSource.length > 0 && this.flatList.scrollToIndex({ index: 0, animated: true });
      this._setPage(1);
      this.props.onFetch(this._getPage(), this._postRefresh, options);
    }
  };

  _postRefresh = (rows = [], options = {}) => {
    if (this.mounted) {
      this._updateRows(rows, options);
    }
  };


  _onPaginate = () => {
    if (this.state.paginationStatus === 'allLoaded') {
      return null
    } else {
      this.setState({
        paginationStatus: 'fetching',
      });
      this.props.onFetch(this._getPage() + 1, this._postPaginate, {});
    }
  };

  _postPaginate = (rows = [], options = {}) => {
    this._setPage(this._getPage() + 1);
    var mergedRows = null;
    if (this.props.withSections === true) {
      mergedRows = MergeRecursive(this._getRows(), rows);
    } else {
      mergedRows = this._getRows().concat(rows);
    }

    if (this.props.distinctRows) {
      mergedRows = this.props.distinctRows(mergedRows);
    }

    this._updateRows(mergedRows, options);
  };

  _updateRows = (rows = [], options = {}) => {
    if (rows !== null) {
      this._setRows(rows);
      if (this.props.withSections === true) {
        this.setState({
          dataSource: rows,
          isRefreshing: false,
          paginationStatus: (options.allLoaded === true ? 'allLoaded' : 'waiting'),
        });
      } else {
        this.setState({
          dataSource: rows,
          isRefreshing: false,
          paginationStatus: (options.allLoaded === true ? 'allLoaded' : 'waiting'),
        });
      }
    } else {
      this.setState({
        isRefreshing: false,
        paginationStatus: (options.allLoaded === true ? 'allLoaded' : 'waiting'),
      });
    }
  };

  _renderPaginationView = () => {
    if ((this.state.paginationStatus === 'fetching' && this.props.pagination === true) || (this.state.paginationStatus === 'firstLoad' && this.props.firstLoader === true)) {
      return this.paginationFetchingView();
    } else if (this.state.paginationStatus === 'waiting' && this.props.pagination === true && (this.props.withSections === true || this._getRows().length > 0)) {
      return this.paginationWaitingView(this._onPaginate);
    } else if (this.state.paginationStatus === 'allLoaded' && this.props.pagination === true) {
      return this.paginationAllLoadedView();
    } else if (this._getRows().length === 0) {
      return this.emptyView(this._onRefresh);
    } else {
      return null;
    }
  };

  renderRefreshControl = () => {
    if (this.props.renderRefreshControl) {
      return this.props.renderRefreshControl({ onRefresh: this._onRefresh });
    }
    return (
      <RefreshControl
        onRefresh={this._onRefresh}
        refreshing={this.state.isRefreshing}
        colors={this.props.refreshableColors}
        progressBackgroundColor={this.props.refreshableProgressBackgroundColor}
        size={this.props.refreshableSize}
        tintColor={this.props.refreshableTintColor}
        title={this.props.refreshableTitle}
      />
    );
  };

  render() {
    return (
      <FlatList
        ref={flatList => { this.flatList = flatList; }}
        data={this.state.dataSource}
        renderItem={({ item, index }) => this.props.rowView(item, 0, index)}
        renderSectionHeader={this.props.sectionHeaderView}
        ListHeaderComponent={this.headerView}
        ListFooterComponent={this._renderPaginationView}
        renderSeparator={this.renderSeparator}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={this.props.scrollEnabled}
        canCancelContentTouches={true}
        refreshControl={this.props.refreshable === true ? this.renderRefreshControl() : null}

        {...this.props}

        style={this.props.style}
      />
    );
  }
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#CCC'
  },
  actionsLabel: {
    fontSize: 20,
  },
  paginationView: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  defaultView: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  defaultViewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  }
});
