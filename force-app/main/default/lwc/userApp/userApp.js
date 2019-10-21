import { LightningElement, api,track } from 'lwc';

export default class UserApp extends LightningElement {
    @api payload = {};
    @track shownav="slds-hide";
    @track showdashboard="";
    @api
    handelPayloadChange(event){
        this.payload = event.detail
    }
    changeTheNav(event){
        this.shownav="";
        this.showdashboard="slds-hide";
        var navItem = event.target.component; 
        this.template.querySelector('c-nav-component').changeActiveNav(navItem) ; 
    }
}