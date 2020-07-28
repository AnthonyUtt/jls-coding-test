import React, { useState, useEffect, FormEvent } from 'react';
import Axios from 'axios';

import AppBar from '@material-ui/core/AppBar';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputBase from '@material-ui/core/InputBase';
import SearchIcon from '@material-ui/icons/Search';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import { makeStyles, fade } from '@material-ui/core/styles';

import InventoryTable, { CoreProduct } from './table';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    title: {
        flexGrow: 1,
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(1),
            width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
            width: '20ch',
            },
        },
    },
    loadingWheel: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 100,
    },
    table: {
        minWidth: 650,
    },
}));

function SearchPage() {
    const classes = useStyles();

    const [ loading, setLoading ] = useState(false);
    const [ search, setSearch ] = useState('');
    const [ data, setData ] = useState<Array<CoreProduct>>();

    useEffect(() => {
        populateList(undefined);
    });

    const populateList = (keyword: string | undefined) => {
        if (loading) {
            return;
        }
        setLoading(true);

        let config;
        if (keyword) {
            config = {
                params: {
                    search: keyword,
                },
            };
        }

        Axios.get('http://anthonyutt.pythonanywhere.com/products', config?config:undefined)
        .then(res => {
            setData(res.data);
            setLoading(false);
        })
        .catch(err => console.error(err));
    };

    const onSearch = (e: FormEvent) => {
        populateList(search);
        e.preventDefault();
    }

    return (
        <div className="SearchPage">
            <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Typography className={classes.title} variant="h6" color="inherit">
                        Inventory Management System
                    </Typography>
                    <div className={classes.search}>
                        <div className={classes.searchIcon}>
                            <SearchIcon />
                        </div>
                        <form onSubmit={onSearch}>
                        <InputBase
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            classes={{ root: classes.inputRoot, input: classes.inputInput}}
                            inputProps={{ 'aria-label': 'search' }}
                            
                        />
                        <button type="submit" hidden={true} />
                        </form>
                    </div>
                </Toolbar>
            </AppBar>
            {loading && 
            <div className={classes.loadingWheel}>
                <CircularProgress size={100} thickness={2.5} color="secondary" />
            </div>
            }
            {data &&
            <InventoryTable data={data} />
            }
            </div>
        </div>
    );
}

export default SearchPage;
