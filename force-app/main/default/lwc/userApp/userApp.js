import { LightningElement, api } from 'lwc';

export default class UserApp extends LightningElement {
    @api payload = {};
    @api
    handelPayloadChange(event){
        this.payload = event.detail
    }
    changeTheNav(event){
        var navItem = event.target.getAttribute("data-nav-id") ; 
        this.template.querySelector('c-nav-component').changeActiveNav(navItem) ; 
    }
}