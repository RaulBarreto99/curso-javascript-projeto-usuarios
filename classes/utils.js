class Utils{

    static dateFormat(date){

        let dateAux = (date.getDate() < 10) ? ('0'+date.getDate()) : date.getDate();

        let monthAux = (date.getMonth()+1 < 10) ? ('0'+(date.getMonth()+1)) : date.getMonth()+1;


        return dateAux + '/' + monthAux + '/' + date.getFullYear()
    }
}