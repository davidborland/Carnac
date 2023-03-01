/*=========================================================================
 
 Name:        TranscriptJSON.pde
 
 Author:      David Borland, The Renaissance Computing Institute (RENCI)
 
 Copyright:   The Renaissance Computing Institute (RENCI)
 
 Description: Convert transcript details file to JSON for specified gene.
 
=========================================================================*/
 
 
String gene = "CPZ";
 

void setup() {
  // Processing setup
  size(512, 512);
  
  String fileLines[] = loadStrings("details.txt");
  
  println("hello");
}
