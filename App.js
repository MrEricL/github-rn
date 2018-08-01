/*
 * @format
 * @flow
Display name of current directory in the header -> edit that
Navigate far up the stack -> put a drop down element, build from the array, and push that many pages back
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  FlatList,
  Button,
} from 'react-native';
import { Card } from 'react-native-elements';
import { createStackNavigator } from 'react-navigation';
import { Buffer } from 'buffer';

var base64 = require('base-64');
type Props = {};

export default class App extends React.Component {
  render() {
    return <MyNavigator />;
  }
}

//Calls the API given the name, owner, and path

async function callAPI(r, o, p) {
  let link = formatURL(r, o, p);
  //console.log(link);

  try {
    let response = await fetch(link);

    let responseJson = await response.json();
    let formattedJSON = formatJSON(responseJson);

    return formattedJSON;
  } catch (error) {
    console.error(error);
  }
}

function formatJSON(f) {
  let l = [];

  if (typeof f.name == 'string') {
    let objectToStore = {
      name: f.name,
      type: f.type,
      content: f.content,
    };
    l.push(objectToStore);
  } else {
    for (var i = 0; i < f.length; i++) {
      let objectToStore = { name: f[i].name, type: f[i].type, content: '' };
      l.push(objectToStore);
    }
  }
  return l;
}

//Formats the proper API call based on name, owner, and path
function formatURL(r, o, p) {
  let baseURL = 'https://api.github.com/repos/' + o + '/' + r + '/contents';
  if (p.length == 1) {
    return baseURL;
  } else {
    for (var i = 1; i < p.length; i++) {
      baseURL = baseURL.concat('/');
      baseURL = baseURL.concat(p[i]);
    }
    return baseURL;
  }
}

function checkName(JSON) {
  return true;
}

//First Screeen
class sr extends React.Component {
  static navigationOptions = {
    headerTitle: 'Search',
  };

  constructor(props) {
    super(props);
    this.state = {
      owner: 'mrericl',
      repo: 'GET',
      path: [''],
    };
  }

  render() {
    const { push } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Git Nav{'\n'}</Text>
        <TextInput
          style={{
            height: 20,
            borderColor: 'black',
            borderWidth: 1,
            width: 200,
          }}
          onChangeText={repo => this.setState({ repo })}
          value={this.state.repo}
        />
        <TextInput
          style={{
            height: 20,
            borderColor: 'black',
            borderWidth: 1,
            width: 200,
          }}
          onChangeText={owner => this.setState({ owner })}
          value={this.state.owner}
        />
        <Button
          title="Find files"
          onPress={
            () =>
              push('Directory', {
                sentrepo: this.state.repo,
                sentown: this.state.owner,
                sentpath: this.state.path,
                content: '',
              })
            //data:callAPI()})
            //this.props.navigation.navigate('Directory')
          }
        />
      </View>
    );
  }
}

//Second Screen
class dir extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: `${navigation.state.params.screen}`,
    };
  };

  componentDidMount() {
    const { setParams } = this.props.navigation;
    let sentrepo = this.props.navigation.state.params.sentrepo;
    let sentown = this.props.navigation.state.params.sentown;
    let sentpath = this.props.navigation.state.params.sentpath;
    let content = this.props.navigation.state.params.content;

    if (sentpath.length == 1) {
      setParams({ screen: sentrepo });
    } else {
      setParams({ screen: sentpath[sentpath.length - 1] });
    }

    callAPI(sentrepo, sentown, sentpath).then(ar => {
      console.log(ar)
      this.setState({ data: ar });
      if (content != '') {
        this.setState({ content: ar[0].content });
      }
      

    });
  }
  constructor(props) {
    super(props);
    this.state = {
      data: ['test'],
      content: '',
    };
  }

  // Function to handle the on press for inner directories
  // Personal note: two on item press, if its not a directory, make it render the base64
  onItemPress(item) {
    const { push } = this.props.navigation;
    let repo = this.props.navigation.state.params.sentrepo;
    let own = this.props.navigation.state.params.sentown;
    let path = this.props.navigation.state.params.sentpath;
    if (item.type == 'dir') {
      path = path.slice();
      path.push(item.name);
      push('Directory', { sentrepo: repo, sentown: own, sentpath: path });
    }

    if (item.type == 'file') {
      path = path.slice();
      path.push(item.name);
      push('Directory', { sentrepo: repo, sentown: own, sentpath: path });
    }
  }

  render() {
    const shouldRender = this.state.content == '';
    let decodeContent = Buffer.from(this.state.content, 'base64').toString(
      'ascii'
    );
    //console.log(this.state.data);
    return (
      <View style={styles.dirstyle}>
        {shouldRender ? (
          <FlatList
            data={this.state.data}
            renderItem={({ item }) => {
              if (item.type == 'dir') {
                return (
                  <Card>
                    <Text
                      style={styles.cardLink}
                      onPress={() => this.onItemPress(item)}>
                      {item.name}
                    </Text>
                  </Card>
                );
              } else {
                return (
                  <Card>
                    <Text
                      style={styles.cardFont}
                      onPress={() => this.onItemPress(item)}>
                      {item.name}{' '}
                    </Text>
                  </Card>
                );
              }
            }}
          />
        ) : (
          <Text style={styles.file}>{decodeContent}</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  dirstyle: {
    backgroundColor: '#F5FCFF',
    flex: 1,
  },
  cardFont: {
    color: 'black',
  },
  cardLink: {
    color: 'green',
  },
  file: {
    padding: 15,
  },
});

const MyNavigator = createStackNavigator(
  {
    Search: { screen: sr },
    Directory: {
      screen: dir,
    },
  },
  {
    initialRouteName: 'Search',
  }
);
