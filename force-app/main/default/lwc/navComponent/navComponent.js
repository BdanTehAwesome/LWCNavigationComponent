import { LightningElement,track } from 'lwc';
import {fireEvent} from 'c/eventHandler';

export default class Home extends LightningElement {

    @track selectedTab ={
        compInf:"",
        billInf:"",
        empInf:""
    }
    @track currentComponent="";

    clickEvent(event){
        var currentcomponent = event.target ; 
        this.template.querySelectorAll('lightning-menu-item').forEach(element => {
            element.classList.add('notSelected'); // Add too everything
            element.classList.remove('tabSelected'); // Remove from everything
        });
        currentcomponent.classList.toggle('tabSelected') ;
        currentcomponent.classList.toggle('notSelected') ;
        this.to= currentcomponent.getAttribute("data-route") ; 

        /* if(currentcomponent==='company') {
            this.selectedTab.compInf="tabSelected";
            this.selectedTab.billInf="notSelected";
            this.selectedTab.empInf="notSelected";
        }
        else if(currentcomponent==='billing') {
            this.selectedTab.compInf="notSelected";
            this.selectedTab.billInf="tabSelected";
            this.selectedTab.empInf="notSelected";
            this.to="/billingInfo"
        }
        else if(currentcomponent==='employee') {
            this.selectedTab.compInf="notSelected";
            this.selectedTab.billInf="notSelected";
            this.selectedTab.empInf="tabSelected";
            this.to="/employeeInfo"
        } */
        event.preventDefault();
        try {
            if(!this.to){
                throw new Error(
                    'To attribute is mandetory for navigate'
                );
            }
            this.className ="colourred";
            fireEvent('navigateTo', {to:this.to, payload:this.payload});
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error, error.stack)
        }
        event.stopPropagation();
    }
}