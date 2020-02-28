import React from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    Text,
    Dimensions,
    TouchableOpacity,
    Keyboard,
} from 'react-native';
import axios from 'axios';
import _ from 'lodash'

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

class PlaceInput extends React.Component{

    constructor(props, id){
        super(props);
        this.id = id;
        this.state={
            predictions: [],
            destinationInput: '',
        }
        this.getPlaces = this.getPlaces.bind(this);
        this.getPlacesDebounced = _.debounce(this.getPlaces, 500);
        this.setDestination = this.setDestination.bind(this);
    }

    async getPlaces(input){
        const { userLatitude, userLongitude } = this.props;
        const result = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${MY_API_KEY}&input=${input}&location=${userLatitude},${userLongitude}&radius=2000`
        );
        this.setState({
            predictions: result.data.predictions
        });
    }

    setDestination(main_text, place_id){
        Keyboard.dismiss();
        this.setState({
            destinationInput: main_text,
            predictions: [],
        })
        this.props.showDirectionOnMap(place_id);
    }

    render() {
        console.log(this.state);
        const predictions = this.state.predictions.map(prediction => {
            const { id, structured_formatting, place_id } = prediction;
            return(
                <TouchableOpacity 
                    key={id} 
                    onPress={() => this.setDestination(structured_formatting.main_text, place_id)}    
                >
                    <View style={styles.suggestion}>
                        <Text style={styles.mainText}>{structured_formatting.main_text}</Text>
                        <Text style={styles.secText}>{structured_formatting.secondary_text}</Text>
                    </View>
                </TouchableOpacity>
            );
        } )
        return (
            <View>
                <TextInput 
                    key={this.id}
                    autoCorrect={false}
                    autoCapitalize='none'
                    style={styles.inputStyle}
                    placeholder='Search your places'
                    onChangeText={(input) => {
                        this.setState({destinationInput: input});
                        this.getPlacesDebounced(input);
                    }}
                    value={this.state.destinationInput}
                />
                {predictions}
            </View>
        )
    } 
}

const styles = StyleSheet.create({
    inputStyle:{
        height: 40,
        marginTop: 55,
        padding: 5,
        backgroundColor: 'white',
        shadowColor: '#000000',
        elevation: 7,
        shadowRadius: 5,
        shadowOpacity: 1,
        width: (WIDTH-48),
        alignSelf: 'center'
    },
    suggestion:{
        backgroundColor: 'white',
        padding: 10,
        borderWidth: 0.5,
        width: (WIDTH-48),
        alignSelf: 'center'
    },
    secText:{
        color: '#777'
    },
    mainText:{
        color: '#000'
    }
})

export default PlaceInput;