import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import SearchPage from './components/search';
import ProductPage from './components/product';

const App = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={SearchPage} />
                <Route exact path="/products/:id" component={ProductPage} />
            </Switch>
        </Router>
    );
};

export default App;