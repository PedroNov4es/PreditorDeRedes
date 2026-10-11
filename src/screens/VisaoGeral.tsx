import { Text, View } from 'react-native';
import TextComponent from '../components/test/TextComponent';

export default function VisaoGeral(){
    return(
       <View>
        <Text><h1>Visão Geral do Preditor de Redes</h1></Text>
        <Text><h2>Resumo do monitoramento da rede</h2></Text>
        <TextComponent/>
       </View>
    );
}