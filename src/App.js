import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react'
import { createBrowserHistory } from 'history'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Cookies from 'js-cookie';
import $ from "jquery";

export const history = createBrowserHistory();

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      items: "",
      new_items: "",
      fb_items: "",
      auth_code: (Cookies.get("auth_code")) ? Cookies.get("auth_code") : "",
      access_token: (Cookies.get("access_token")) ? Cookies.get("access_token") : "",
      refresh_token: (Cookies.get("refresh_token")) ? Cookies.get("refresh_token") : "",
      grant_type: "authorization_code",
      refresh_call: (Cookies.get("refresh_call")) ? Cookies.get("refresh_call") : "",
      item_urls: "",
      updated_fbitems: "",
      first_call: (Cookies.get("first_call")) ? Cookies.get("first_call") : "false",
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.newItem = this.newItem.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.freshConnect = this.freshConnect.bind(this);
    this.fetchItems = this.fetchItems.bind(this);
    this.fetchAuthCode = this.fetchAuthCode.bind(this);
    this.matchItems = this.matchItems.bind(this);

  }

  componentDidMount(props) {
    fetch('http://localhost:5000/api/items', {
      method: "GET",
      mode: "cors",
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        if (response.status === 200) {
          this.setState({
            successful: true
          });
        }
        response.json().then((responseJson) => {
          //  resolve(responseJson)
          if (responseJson != null) {
            console.log(responseJson)
            this.setState({
              items: responseJson
            })
            console.log(this.state.items)
          }
        })
      })

    if (this.state.first_call == "false") {
      Cookies.set('first_call', "true", { path: '/' });
      this.setState({
        first_call: "true"
      },
        () => {
          window.location = "https://my.freshbooks.com/service/auth/oauth/authorize?client_id=4e32d45b40edc5f9e9d4ba820062635a35d6546b76ffea388cd00775ba3ca9df&response_type=code&redirect_uri=https://www.localhost:3000";
        }
      )

    }
    else if (this.state.first_call == "true" && this.state.auth_code == "") {
      this.fetchAuthCode()
    }
    else {
      this.freshConnect()
    }
  }

  fetchAuthCode = () => {
    if (window.location.href.indexOf("?code=") > -1) {
      var url = window.location.href;
      var code = url.split("?code=").pop();

      this.setState({
        auth_code: code
      },
        () => {
          Cookies.set('auth_code', code, { path: '/' });
          this.freshConnect()
        }
      )
    }
  }

  freshConnect = () => {

    console.log(this.state.auth_code)

    if (!this.state.access_token || !this.state.refresh_token) {
      fetch('https://api.freshbooks.com/auth/oauth/token', {
        method: "POST",
        mode: "cors",
        headers: {
          'Content-Type': 'application/json',
          'API-Version': 'alpha'
        },
        body: JSON.stringify({
          "grant_type": this.state.grant_type,
          "client_secret": "444fa34ecae76b400b0752d3cf7ce6b39759d5c8c24702c03fc797b79242555c",
          "code": this.state.auth_code,
          "client_id": "4e32d45b40edc5f9e9d4ba820062635a35d6546b76ffea388cd00775ba3ca9df",
          "redirect_uri": "https://www.localhost:3000"
        })
      }).then((response) => {
        response.json().then((responseJson) => {
          console.log(responseJson)
          if (responseJson.access_token) {
            var d = new Date();
            var expiry = d.getTime() + (12 * 60 * 60 * 1000);
            // console.log(new Date(expiry));

            Cookies.set('access_token', responseJson.access_token, { path: '/', expires: expiry });
            Cookies.set('refresh_token', responseJson.refresh_token, { path: '/' });

            this.setState({
              access_token: responseJson.access_token,
              refresh_token: responseJson.refresh_token
            },
              () => this.fetchItems()
            )
          }
          // else if (responseJson.error == "invalid_grant") {

          //   window.location = "https://my.freshbooks.com/service/auth/oauth/authorize?client_id=4e32d45b40edc5f9e9d4ba820062635a35d6546b76ffea388cd00775ba3ca9df&response_type=code&redirect_uri=https://www.localhost:3000";
          // }
          else if (responseJson.error) {
            this.setState({
              grant_type: "refresh_token",
            })
            // console.log(this.state.grant_type)
            this.freshRefresh()
          }
          else {
            this.setState({
              auth_code: ""
            })
            window.location.reload(true)
          }
        })
      })
    } else {
      this.fetchItems()
    }
  }


  freshRefresh = () => {

    fetch('https://api.freshbooks.com/auth/oauth/token', {
      method: "POST",
      mode: "cors",
      headers: {
        'Content-Type': 'application/json',
        'API-Version': 'alpha'
      },
      body: JSON.stringify({
        "grant_type": this.state.grant_type,
        "client_secret": "444fa34ecae76b400b0752d3cf7ce6b39759d5c8c24702c03fc797b79242555c",
        "refresh_token": this.state.refresh_token,
        "client_id": "4e32d45b40edc5f9e9d4ba820062635a35d6546b76ffea388cd00775ba3ca9df",
        "redirect_uri": "https://www.localhost:3000"
      })
    }).then((response) => {
      response.json().then((responseJson) => {
        console.log(responseJson)
        console.log(this.state.grant_type)
        if (responseJson.access_token) {
          var d = new Date();
          var expiry = d.getTime() + (12 * 60 * 60 * 1000);
          Cookies.set('access_token', responseJson.access_token, { path: '/', expires: expiry });
          Cookies.set('refresh_token', responseJson.refresh_token, { path: '/' });

          this.setState({
            access_token: responseJson.access_token,
            refresh_token: responseJson.refresh_token
          },
            () => this.fetchItems()
          )
        }

        else {
          // Cookies.set('refresh_call', true, { path: '/' });
          // this.setState({
          //   refresh_call: true
          // })
          // this.setState({
          //   access_token: responseJson.access_token,
          //   refresh_token: responseJson.refresh_token
          // })
          Object.keys(Cookies.get()).forEach(function (cookieName) {
            var neededAttributes = { path: '' };
            Cookies.remove(cookieName, neededAttributes);
          });
          window.location.reload(true)
        }
      })
    })
  }


  fetchItems = () => {

    fetch('https://api.freshbooks.com/accounting/account/3xkx82/items/items', {
      method: "GET",
      mode: "cors",
      headers: {
        'Authorization': 'Bearer ' + this.state.access_token,
        'Content-Type': 'application/json',
        'API-Version': 'alpha'
      }
    }).then((response) => {
      response.json().then((responseJson) => {
        //  resolve(responseJson)
        console.log(responseJson)
        if (responseJson.response.result != null) {
          this.setState({
            fb_items: responseJson.response.result.items
          },
            () => this.matchItems()
          )
        }
        if (responseJson.response.errors) {
          this.setState({
            grant_type: "refresh_token"
          })
          this.freshConnect()
        }
      })
    })
  }

  matchItems = () => {
    console.log(this.state.fb_items)

  }

  handleSubmit = (e) => {
    e.preventDefault();

    console.log(this.state.fb_items)

    var result1 = this.state.items;
    var result2 = this.state.fb_items;

    var result = result2.filter(function (o1) {
      return result1.some(function (o2) {
        return o1.item_name === o2.name;
      })
    }).map(function (o) {
      return o;
    });

    result.forEach(item => {
      var matchingObj = result1.filter(obj => obj.item_name === item.name)[0];
      item.qty = matchingObj.item_quantity;
      item.description = matchingObj.item_desc;
    });

    var urls = [];

    result.map(items =>
      urls.push('https://api.freshbooks.com/accounting/account/3xkx82/items/items/' + items["id"])
    )
    console.log(result)

    fetch("http://localhost:5000/api/items", {
      method: "POST",
      mode: "cors",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.items)
    })
      .then((response) => {
        if (response.status == 200) {
          alert("items saved!")
        }
        console.log(response)
      })

    Promise.all(result.map(u =>
      fetch('https://api.freshbooks.com/accounting/account/3xkx82/items/items/' + u["id"], {
        method: "PUT",
        mode: "cors",
        headers: {
          'Authorization': 'Bearer ' + this.state.access_token,
          'Content-Type': 'application/json',
          'API-Version': 'alpha'
        },
        body: JSON.stringify({
          "item": {
            "name": u["name"],
            "qty": u["qty"],
            "description": u["description"] + " stock quantity:" + u["qty"]
          }
        })
      }
      ))).then(responses =>
        Promise.all(responses.map(res => res.json()
        ))
      ).then(json => {
        console.log(json)
      })

  }
  newItem = () => {

    this.setState(prevState => {
      return {
        items: [
          ...prevState.items,
          {
            item_desc: "",
            item_name: "",
            item_quantity: ""
          },
        ]
      }
    },
    )
  }

  handleChange = (event) => {

    const index = event.target.id;
    const items = this.state.items[index];
    items[event.target.name] = event.target.value;

    const name = event.target.name;
    const value = event.target.value;
    this.setState({
      [items]: items
    },
      () => this.handleMapping()
    );
  }



  // handleNewChange = (event) => {
  //   const index = event.target.id;
  //   const newitems = this.state.new_items[index];
  //  newitems[event.target.name] = event.target.value;

  //   const name = event.target.name;
  //   const value = event.target.value;
  //       this.setState({
  //         [newitems]: newitems
  //   },
  //   () => this.handleMapping()
  //   );
  // }

  handleMapping = () => {
    console.log(this.state.items)
    console.log(this.state.new_items)

  }
  render() {
    console.log(typeof this.state.items)
    return (
      <div>
        <form className="search-form" onSubmit={this.handleSubmit}>
          {
            (typeof this.state.items === 'object')

              ?
              this.state.items.map((item, index) =>
                <div index={index} className="existing">
                  <input type="text"
                    name="item_name"
                    id={index}
                    value={item["item_name"]}
                    ref={(input) => this.query = input}
                    onChange={this.handleChange}
                    placeholder={item["item_name"]} />
                  <input type="text"
                    name="item_desc"
                    id={index}
                    value={item["item_desc"]}
                    ref={(input) => this.query = input}
                    onChange={this.handleChange}
                    placeholder={item["item_desc"]} />

                  <input type="text"
                    name="item_quantity"
                    id={index}
                    value={item["item_quantity"]}
                    ref={(input) => this.query = input}
                    onChange={this.handleChange}
                    placeholder={item["item_quantity"]} />
                </div>
              )
              : ""

          }

          {/* {

            (typeof this.state.new_items === 'object' && this.state.new_items !== null)

              ?
              this.state.new_items.map((item, index) =>
                <div index={index} className="newItem">
                  <input type="text"
                    name="item_name"
                    id={index}
                    value={item.item_name}
                    ref={(input) => this.query = input}
                    onChange={this.handleNewChange}
                    placeholder={item.item_name} />
                  <input type="text"
                    name="item_desc"
                    id={index}
                    value={item.item_desc}
                    ref={(input) => this.query = input}
                    onChange={this.handleNewChange}
                    placeholder={item.item_desc} />

                  <input type="text"
                    name="item_quantity"
                    id={index}
                    value={item.item_quantity}
                    ref={(input) => this.query = input}
                    onChange={this.handleNewChange}
                    placeholder={item.item_quantity} />

                </div>

              )
              : ""

          } */}
          <div class="plus" onClick={this.newItem}></div>
          <button type="submit" id="submit" className="search-button" onClick={this.handleSubmit}>SAVE</button>
        </form>
      </div>
    )
  }
}


