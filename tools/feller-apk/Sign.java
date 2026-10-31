import com.android.apksig.*;
import java.io.File; import java.io.FileInputStream; import java.security.*; import java.security.cert.X509Certificate; import java.util.*;
public class Sign { public static void main(String[] a) throws Exception {
  KeyStore ks=KeyStore.getInstance("JKS"); ks.load(new FileInputStream(""+a[2]+""),"android".toCharArray());
  PrivateKey k=(PrivateKey)ks.getKey("feller","android".toCharArray()); X509Certificate c=(X509Certificate)ks.getCertificate("feller");
  ApkSigner.SignerConfig cfg=new ApkSigner.SignerConfig.Builder("feller",k,Arrays.asList(c)).build();
  new ApkSigner.Builder(Arrays.asList(cfg)).setInputApk(new File(a[1])).setOutputApk(new File(a[0])).setMinSdkVersion(23).setV1SigningEnabled(true).setV2SigningEnabled(true).setV3SigningEnabled(true).build().sign();
  ApkVerifier.Result r=new ApkVerifier.Builder(new File(a[0])).build().verify();
  System.out.println("verificada="+r.isVerified()+" v1="+r.isVerifiedUsingV1Scheme()+" v2="+r.isVerifiedUsingV2Scheme()+" v3="+r.isVerifiedUsingV3Scheme());
  for(Object e: r.getErrors()) System.out.println("ERROR "+e);
}}
