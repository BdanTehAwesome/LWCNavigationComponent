import { LightningElement, api,track } from 'lwc';

export default class UserApp extends LightningElement {
    @api payload = {};
    @track shownav="slds-hide";
    showdashboard = "";
    @api
    handelPayloadChange(event){
        this.payload = event.detail
    }
    changeTheNav(event){
        event.target.parentElement.classList.toggle("slds-hide")
        this.shownav="";
        var navItem = event.target.component; 
        this.template.querySelector('c-nav-component').changeActiveNav(navItem) ; 
    }
}