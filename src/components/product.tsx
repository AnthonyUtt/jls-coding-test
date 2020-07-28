import React, { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import Axios from 'axios';

import AppBar from '@material-ui/core/AppBar';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableFooter from '@material-ui/core/TableFooter';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';

type CoreProductFull = {
    Active: string;
    BackupVendor: string;
    BackupVendorSKU: string;
    BoxesPerCase: number;
    BufferDays: number;
    CasePack: number;
    CoreNumber: string;
    Hazmat: string;
    IgnoreUntil: string;
    InternalTitle: string;
    MOQ: number;
    MinimumLevel: number;
    NoteForNextOrder: string;
    Notes: string;
    PiecesPerInternalBox: number;
    ProductURL: string;
    Restockable: string;
    Tag1: string;
    Tag2: string;
    Tag3: string;
    Tag4: string;
    TagsAndInfo: string;
    Vendor: string;
    VendorCasePack: number;
    VendorOrderUnit: string;
    VendorSKU: string;
    VendorTitle: string;
};

type Locations = {
    Location: string;
    ProductCode: string;
    Quantity: number;
    Warehouse: string;
};

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
    loadingWheel: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 100,
    },
    list: {
        listStyleType: 'none',
    },
    table: {
        maxWidth: 480,
    },
}));

const ProductPage = () => {
    const { id } = useParams();
    const classes = useStyles();

    const [ loading, setLoading ] = useState(true);
    const [ info, setInfo ] = useState<CoreProductFull>();
    const [ locations, setLocations ] = useState<Array<Locations>>();
    const [ total, setTotal ] = useState(0);

    const [ warehouses, setWarehouses ] = useState<string[]>([]);

    const [ tType, setTType ] = useState('increment');
    const [ source, setSource ] = useState('');
    const [ dest, setDest ] = useState('C46');
    const [ qty, setQty ] = useState(0);


    useEffect(() => {
        if (!info) {
            Axios({
                url: `http://anthonyutt.pythonanywhere.com/products/${id}`,
                method: 'get',
            })
            .then(res => {
                setInfo(res.data);
                setLoading(false);
            })
            .catch(err => console.error(err));
        }

        if (!locations) {
            Axios({
                url: `http://anthonyutt.pythonanywhere.com/locations/${id}`,
                method: 'get',
            })
            .then(res => {
                setLocations(res.data);
                setTotal(res.data.map((loc: Locations) => loc.Quantity).reduce((acc: number, x: number) => acc + x));
            })
            .catch(err => console.error(err));
        }

        if (warehouses.length === 0) {
            Axios({
                url: 'http://anthonyutt.pythonanywhere.com/warehouses',
                method: 'get',
            })
            .then(res => {
                setWarehouses(res.data);
            })
            .catch(err => console.error(err));
        }
    });

    const addInventory = (e: FormEvent) => {
        let formData = new FormData();
        formData.set('quantity', qty.toString());
        formData.set('source', `{ "warehouse": "1. Cores", "code":"${id}", "location":"${dest}" }`);

        Axios({
            url: `http://anthonyutt.pythonanywhere.com/locations/${id}`,
            method: 'post',
            headers: { 'Content-Type': 'multipart/form-data' },
            data: formData,
        })
        .then(() => {
            setLocations(undefined);
        })
        .catch(err => console.error(err));

        e.preventDefault();
    };

    const createTransaction = (e: FormEvent) => {
        let formData = new FormData();
        formData.set('function', tType);
        formData.set('quantity', qty.toString());
        formData.set('source', `{ "warehouse":"1. Cores", "code":"${id}", "location":"${source}" }`);
        formData.set('dest', `{ "warehouse":"1. Cores", "code":"${id}", "location":"${dest}" }`);

        Axios({
            url: "http://anthonyutt.pythonanywhere.com/transaction",
            method: "post",
            headers: { 'Content-Type': 'multipart/form-data' },
            data: formData,
        })
        .then((res) => console.log(res))
        .catch(err => console.error(err));

        e.preventDefault();
    };

    const srcDisabled = tType === 'increment';
    const destDisabled = tType === 'decrement';

    return (
        <div className="ProductPage">
            <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Typography className={classes.title} variant="h6" color="inherit">
                        Inventory Management System
                    </Typography>
                </Toolbar>
            </AppBar>
            {loading && 
            <div className={classes.loadingWheel}>
                <CircularProgress size={100} thickness={2.5} color="secondary" />
            </div>
            }
            {info &&
            <div>
                <h3>Product Info</h3>
                <ul className={classes.list}>
                    <li>Core Number: { info.CoreNumber }</li>
                    <li>Internal Title: { info.InternalTitle }</li>
                    <li>Vendor: { info.Vendor }</li>
                    <li>Vendor Title: { info.VendorTitle }</li>
                    <li>Vendor SKU: { info.VendorSKU }</li>
                    <li>Backup Vendor: { info.BackupVendor }</li>
                    <li>Backup Vendor SKU: { info.BackupVendorSKU }</li>
                    <li>Restockable: { info.Restockable }</li>
                    <li>Vendor Order Unit: { info.VendorOrderUnit }</li>
                    <li>Vendor Case Pack: { info.VendorCasePack }</li>
                    <li>MOQ: { info.MOQ }</li>
                    <li>BufferDays: { info.BufferDays }</li>
                    <li>Minimum Level: { info.MinimumLevel }</li>
                    <li>Product URL: { info.ProductURL }</li>
                    <li>Note For Next Order: { info.NoteForNextOrder }</li>
                    <li>Case Pack: { info.CasePack }</li>
                    <li>Pieces Per Internal Box: { info.PiecesPerInternalBox }</li>
                    <li>Boxes Per Case: { info.BoxesPerCase }</li>
                    <li>Tags &amp; Info: { info.TagsAndInfo }</li>
                    <li>Tag 1: { info.Tag1 }</li>
                    <li>Tag 2: { info.Tag2 }</li>
                    <li>Tag 3: { info.Tag3 }</li>
                    <li>Tag 4: { info.Tag4 }</li>
                    <li>Hazmat: { info.Hazmat }</li>
                    <li>Active: { info.Active }</li>
                    <li>Ignore Until: { info.IgnoreUntil }</li>
                    <li>Notes: { info.Notes }</li>
                </ul>
                <h3>Locations</h3>
                <TableContainer component={Paper}>
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Warehouse</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {locations &&
                            locations.map((value, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{value.Warehouse}</TableCell>
                                    <TableCell>{value.Location}</TableCell>
                                    <TableCell align="right">{value.Quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell />
                                <TableCell>Total</TableCell>
                                <TableCell>{total}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </div>
            }
            {
            (locations && locations.length > 0)
            ? <div>
                <h4>Adjust Inventory Levels</h4>
                <form onSubmit={createTransaction}>
                    <label>Function: </label>
                    <select value={tType} onChange={(e) => setTType(e.target.value)}>
                        <option value="increment">Add</option>
                        <option value="decrement">Subtract</option>
                        <option value="transfer">Transfer</option>
                    </select>
                    <br />
                    <label>From: </label>
                    <select value={source} onChange={(e) => setSource(e.target.value)} disabled={srcDisabled}>
                        <option disabled></option>
                        {locations?.map((val, idx) => (
                            <option key={idx} value={val.Location}>{val.Location}</option>
                        ))}
                    </select>
                    <br />
                    <label>To: </label>
                    <select value={dest} onChange={(e) => setDest(e.target.value)} disabled={destDisabled}>
                        <option disabled></option>
                        {warehouses.map((val, idx) => (
                            <option key={idx} value={val}>{val}</option>
                        ))}
                    </select>
                    <br />
                    <label>Quantity: </label>
                    <input type="number" value={qty} min={0} onChange={(e) => setQty(e.target.valueAsNumber)} />
                    <br />
                    <button type="submit">Run Transaction</button>
                </form>
            </div>
            : <div>
                <h4>Add Inventory</h4>
                <form onSubmit={addInventory}>
                    <label>Location: </label>
                    <select value={dest} onChange={(e) => setDest(e.target.value)}>
                        <option disabled></option>
                        {warehouses.map((val, idx) => (
                            <option key={idx} value={val}>{val}</option>
                        ))}
                    </select>
                    <br />
                    <label>Quantity: </label>
                    <input type="number" value={qty} min={0} onChange={(e) => setQty(e.target.valueAsNumber)} />
                    <br />
                    <button type="submit">Add Items</button>
                </form>
            </div>
            }
            </div>
        </div>
    )
};

export default ProductPage;