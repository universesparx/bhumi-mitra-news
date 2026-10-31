import React,{useEffect,useState} from "react";
import {ActivityIndicator,FlatList,Linking,RefreshControl,SafeAreaView,StyleSheet,Text,TouchableOpacity,View} from "react-native";

/** Isolated integration candidate; not imported into the existing Bhumi Mitra app.
 * Configure a reviewed HTTPS endpoint before mounting. No editorial credentials in mobile app.
 */
export type BhoAlertItem={
 id:string;headline_hi:string;summary_hi:string;source_name:string;
 source_url:string;source_publication_date:string;
 category:string;district:string;updated_at:string;
};
type Props={feedUrl:string};
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:"#f5f8f5",padding:14},
 title:{fontSize:22,fontWeight:"700",color:"#155b41",marginBottom:12},
 card:{backgroundColor:"#fff",borderRadius:12,padding:14,marginBottom:12,borderWidth:1,borderColor:"#d9e5dc"},
 heading:{fontSize:17,fontWeight:"700",color:"#19392d",marginBottom:6},
 body:{fontSize:15,color:"#304b3f",lineHeight:23},
 meta:{fontSize:12,color:"#62776b",marginTop:8},
 link:{color:"#126b50",fontWeight:"600",marginTop:10},
 warning:{color:"#a02c2c",marginVertical:10},
});
function isItem(x:unknown):x is BhoAlertItem {
 if(!x||typeof x!=="object")return false;
 const a=x as Record<string,unknown>;
 return ["id","headline_hi","summary_hi","source_name","source_url",
  "source_publication_date","category","district","updated_at"]
  .every(k=>typeof a[k]==="string") &&
  a.headline_hi.length>0 && a.summary_hi.length>0 &&
  /^https:\/\//.test(a.source_url as string);
}
export default function BhoAlertBiharScreen({feedUrl}:Props){
 const [items,setItems]=useState<BhoAlertItem[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const load=async(signal?:AbortSignal)=>{
  if(!/^https:\/\//.test(feedUrl)){setError("सुरक्षित समाचार सेवा उपलब्ध नहीं है।");return;}
  setLoading(true);setError("");
  try{
   const response=await fetch(feedUrl,{method:"GET",headers:{Accept:"application/json"},signal});
   if(!response.ok)throw Error("feed_unavailable");
   const data:unknown=await response.json();
   if(!Array.isArray(data)||data.length>50||!data.every(isItem))throw Error("invalid_feed");
   setItems(data);
  }catch(e){
   if(signal?.aborted)return;
   setError("समाचार अभी उपलब्ध नहीं हैं। कृपया बाद में पुनः प्रयास करें।");
  }finally{if(!signal?.aborted)setLoading(false);}
 };
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);
  return()=>controller.abort();},[feedUrl]);
 const openSource=async(url:string)=>{
  try{const parsed=new URL(url);if(parsed.protocol==="https:"&&
    !parsed.username&&!parsed.password)await Linking.openURL(parsed.href);}
  catch{setError("स्रोत लिंक नहीं खुल सका।");}
 };
 return <SafeAreaView style={styles.page}>
  <Text style={styles.title}>भू-अलर्ट बिहार</Text>
  {error?<Text accessibilityRole="alert" style={styles.warning}>{error}</Text>:null}
  {loading&&!items.length?<ActivityIndicator accessibilityLabel="समाचार लोड हो रहे हैं"/>:null}
  <FlatList data={items} keyExtractor={item=>item.id}
   refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>void load()}/>}
   ListEmptyComponent={!loading?<Text>अभी कोई सत्यापित समाचार उपलब्ध नहीं है।</Text>:null}
   renderItem={({item})=><View style={styles.card}>
    <Text style={styles.heading}>{item.headline_hi}</Text>
    <Text style={styles.body}>{item.summary_hi}</Text>
    <Text style={styles.meta}>{item.source_name} · {item.source_publication_date}{item.district?" · "+item.district:""}</Text>
    <TouchableOpacity accessibilityRole="link" onPress={()=>void openSource(item.source_url)}>
     <Text style={styles.link}>मूल स्रोत देखें</Text>
    </TouchableOpacity>
   </View>}/>
 </SafeAreaView>;
}
