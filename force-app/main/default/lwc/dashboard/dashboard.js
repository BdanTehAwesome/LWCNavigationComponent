import { LightningElement,api } from 'lwc';

export default class Dashboard extends LightningElement {

    @api changeTheNav;
    @api component;
    @api payload = {};
}