import React, { useState } from 'react';
import { 
    TouchableWithoutFeedback,
    StyleSheet,
    Keyboard,
    PermissionsAndroid,
    Platform, 
    View,
    Button,
    FlatList,
    Modal,
    Dimensions
} from 'react-native';

import PlaceInput from '../components/PlaceInput';
import ButtonPro from '../components/Button'

import axios from 'axios';
import PolyLine from '@mapbox/polyline';
import MapView, {Polyline, Marker} from 'react-native-maps'
import Geolocation from 'react-native-geolocation-service';

const INCREMENT = 1;
const HEIGHT = Dimensions.get('window').height
const WIDTH = Dimensions.get('window').width

class MainMap extends React.Component{
    constructor(props){
        super(props);
        this.state={
            hasMapPermission: false,
            userLatitude: 0,
            userLongitude: 0,
            destinationCoords: [],
            numOfInput:[0],
            counter: 0,
            wayPoints: [],
            markers: []
        }
        this.showDirectionOnMap = this.showDirectionOnMap.bind(this);
        this.map = React.createRef();
        this.onAddSearch = this.onAddSearch.bind(this)
        this.onDeleteSearch = this.onDeleteSearch.bind(this)
    }
    

    componentDidMount(){
        this._requestUserLocation();
    }
    
    // Function: Get user current location
    getUserLocation() {
        this.setState({hasMapPermission: true})
        this.watch_location_id = Geolocation.watchPosition(
            (position) => {
                this.setState({
                    userLatitude: position.coords.latitude,
                    userLongitude: position.coords.longitude,
                })
                console.log(position);
            },
            (error) => {
                // See error code charts below.
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            
        );
        
    }

    // Function: Ask user permission for current location
    async _requestUserLocation(){
        try{
            if(Platform.OS === 'android'){
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                if(granted === PermissionsAndroid.RESULTS.GRANTED){
                    this.getUserLocation();
                }else{
                    this.getUserLocation();
                }
            }
        } catch(err){
            console.warn(err);
        }   
    }

    // Function: Request the Directions API from Google
    async showDirectionOnMap(placeId){
        const { userLatitude, userLongitude, wayPoints } = this.state;
        try{
            let result = await axios.get(
                `https://maps.googleapis.com/maps/api/directions/json?key=${MY_API_KEY}&origin=${userLatitude},${userLongitude}&destination=place_id:${placeId}`
            );
            console.log(result.data);
            let points = PolyLine.decode(
                result.data.routes[0].overview_polyline.points
            )
            let latLng = points.map(point => ({
                latitude: point[0],
                longitude: point[1],
            }));
            this.setState({
                destinationCoords: latLng,
                wayPoints: [...this.state.wayPoints, latLng],
                markers: [...this.state.markers, latLng ]
            });
            this.map.current.fitToCoordinates(latLng, {
                edgePadding:{
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });
            console.log(latLng);
            console.log('HELLOOOOOO' + this.state.wayPoints)
            console.log('HELLOOOOOO' + this.state.markers)
        } catch(err){
            console.error(err);
        }
    }

    // Function: Hide keyboard when tapping outside the keyboard
    hideKeyboard(){
        Keyboard.dismiss();
    }

    onAddSearch(){
        this.setState((state) => ({
            counter: state.counter + INCREMENT,
            numOfInput: [...state.numOfInput, state.counter]
        }))
        
        console.log(this.state.counter);
        console.log(this.state.numOfInput);
    }

    onDeleteSearch(inputId){
        this.setState((prevState) => ({
            numOfInput: prevState.numOfInput.filter((el) => {el.id !== inputId })
        }))
    }


    render(){
        const { destinationCoords, userLatitude, userLongitude } = this.state;
        let polyline = null;
        let marker = null;
        if(destinationCoords.length > 0){
            polyline = this.state.wayPoints.map((wayPoint) => {
                <Polyline 
                    coordinates={wayPoint}
                    strokeWidth={4}
                    strokeColor='#000'
                />
            });
            marker = this.state.markers.map((marker) => {
                return(
                    <Marker {...marker} />
                )
            })
        }
        //if(this.state.hasMapPermission === true){
            return(
                <TouchableWithoutFeedback onPress={this.hideKeyboard} >
                    <View style={styles.container} >
                        
                        <MapView
                            ref={this.map}
                            showsUserLocation
                            followsUserLocation
                            style={styles.map}
                            region={{
                                latitude: userLatitude,
                                longitude: userLongitude,
                                latitudeDelta: 0.015,
                                longitudeDelta: 0.0121
                            }}
                        >
                            {polyline}
                            {marker}
                        </MapView>

                        <Button title='Add a location' onPress={this.onAddSearch} />
                        <View style={{height: HEIGHT/2 }}>
                            <FlatList
                                data={this.state.numOfInput}
                                keyExtractor={(item, index) => item.id}
                                renderItem={itemData => {
                                    return(
                                        <PlaceInput
                                            key={itemData.item.id}
                                            id={itemData.item.id}
                                            //onDelete={this.removeInputHandler}
                                            showDirectionOnMap={this.showDirectionOnMap}
                                            userLatitude={userLatitude}
                                            userLongitude={userLongitude}
                                        />
                                    )
                                }}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            )
        }
        componentWillUnmount(){
            Geolocation.clearWatch(this.watch_location_id);
        }
    }
//}

export default MainMap;

const styles = StyleSheet.create({
    container:{
        flex: 1
    },
    map:{
        ...StyleSheet.absoluteFillObject
    }
})