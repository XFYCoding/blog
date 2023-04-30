# 关键字ThreadLocal详解

## 什么是ThreadLocal?它有什么用？

当我们某个类需要被多线程共享的时候，我们就可以使用ThreadLocal关键字，ThreadLocal可以为每个线程创建这个变量的副本并存到每个线程的存储空间中(关于这个存储空间后文会展开讲述)，从而确保共享变量对每个线程隔离，实现线程安全。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302225786.png)

举个例子，我们现在有一个应用，应用中有1000个线程，每个线程都会对数据库进行操作，于是我们编写了一个数据库连接工具类:

```java
class ConnectionManager {
	//静态变量，所有线程共享一个connect 
    private static Connection connect = null;

    public static Connection openConnection() {
    	//
        if (connect == null) {
            connect = DriverManager.getConnection();
        }
        return connect;
    }

    public static void closeConnection() {
        if (connect != null)
            connect.close();
    }
}
```

代码很简单，问题也很明显，假如我们1000个线程同时去调用这个工具类建立数据库连接，很可能在同一个时间，同时指向getConnection方法。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302225529.png)

亦或者在getConnection方法期间，某个线程调用closeConnection导致其他线程意外崩溃。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302225583.png)

所以为了保证没必要的重复创建，我们对代码进行改良，将connect 变为普通成员变量。

```java
class ConnectionManager {
    private Connection connect = null;

    public Connection openConnection() {
        if (connect == null) {
            connect = DriverManager.getConnection();
        }
        return connect;
    }

    public void closeConnection() {
        if (connect != null)
            connect.close();
    }
}
```

虽然保证了线程安全，但是问题也来了，每个线程在进行SQL操作时都需要调用openConnection，假如我们1000个线程反复执行SQL操作，如此频繁的openConnection、openConnection将严重影响服务器性能。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302225079.png)

有没有什么办法，可以让线程留住这个变量，下次使用该线程的使用能够复用这个连接呢？

答案就是ThreadLocal，我们对上述代码在进行一次改造

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConnectionManager {

    private static final ThreadLocal<Connection> dbConnectionLocal = new ThreadLocal<Connection>() {
		//每个线程初次调用dbConnectionLocal.get()时，就会在自己内部存储DriverManager.getConnection("", "", "")。
        @Override
        protected Connection initialValue() {
            try {
                return DriverManager.getConnection("", "", "");
            } catch (SQLException e) {
                e.printStackTrace();
            }
            return null;
        }
    };

    public Connection getConnection() {
        return dbConnectionLocal.get();
    }
}
```

我们通过ThreadLocal变量dbConnectionLocal确保每个线程调用getConnection方法时，通过dbConnectionLocal.get()调用initialValue(这个调用流程后续会解释)，实现在这个线程内部存储一个Connection 对象，只要我们没有清除或者关闭当前线程，这个Connection 对象就可以一直使用，且线程之间互不干扰。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302225765.png)

## ThreadLocal基础使用示例

如下所示，基于`ThreadLocal`为每个将每个线程的`id`存到线程内部，彼此之间互不影响。

```java
//THREAD_LOCAL变量
private static ThreadLocal < String > THREAD_LOCAL = new ThreadLocal < > ();
private static Logger logger = LoggerFactory.getLogger(ThreadLocalTest.class);
public static void main(String[] args) {
    Thread t1 = new Thread(() - > {
        logger.info("t1往THREAD_LOCAL存入变量:[{}]", Thread.currentThread().getName());
        THREAD_LOCAL.set(Thread.currentThread().getName());
        logger.info("t1获取THREAD_LOCAL的值为:[{}]", THREAD_LOCAL.get());
    }, "t1");
    Thread t2 = new Thread(() - > {
        logger.info("t2往THREAD_LOCAL存入变量:[{}]", Thread.currentThread().getName());
        THREAD_LOCAL.set(Thread.currentThread().getName());
        logger.info("t2获取THREAD_LOCAL的值为:[{}]", THREAD_LOCAL.get());
        THREAD_LOCAL.remove();
        logger.info("t2删除THREAD_LOCAL的后值为:[{}]", THREAD_LOCAL.get());
    }, "t2");
    t1.start();
    t2.start();
}
```

从输出结果可以看出，两个线程都用THREAD_LOCAL 在自己的内存空间中存储了变量的副本，彼此互相隔离的使用

```java
[t1] INFO com.guide.thread.base.ThreadLocalTest - t1往THREAD_LOCAL存入变量:[t1]
[t1] INFO com.guide.thread.base.ThreadLocalTest - t1获取THREAD_LOCAL的值为:[t1]
[t2] INFO com.guide.thread.base.ThreadLocalTest - t2往THREAD_LOCAL存入变量:[t2]
[t2] INFO com.guide.thread.base.ThreadLocalTest - t2获取THREAD_LOCAL的值为:[t2]
[t2] INFO com.guide.thread.base.ThreadLocalTest - t2删除THREAD_LOCAL的后值为:[null]
```

## 从两种应用场景来介绍一下ThreadLocal

### 日期格式化工具类

#### 错误示例

代码如下，我们创建100个线程使用同一个dateFormat完成日期格式化

```java
private static Logger logger = LoggerFactory.getLogger(MyThreadLocalDemo3.class);
static SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss:SS");
public static void main(String[] args) throws InterruptedException {
    ExecutorService threadPool = Executors.newFixedThreadPool(100);
    for(int i = 0; i < 100; i++) {
        int finalI = i;
        //线程池中的线程
        threadPool.submit(() - > {
            new MyThreadLocalDemo3().caclData(finalI);
        });
    }
    threadPool.shutdown();
}
/**
 * 计算second后的日期
 * @param second
 * @return
 */
public String caclData(int second) {
    Date date = new Date(1000 * second);
    String dateStr = dateFormat.format(date);
    logger.info("{}得到的时间字符串为:{}", Thread.currentThread().getId(), dateStr);
    return dateStr;
}
```

从输出结果可以看出，间隔几毫秒的线程出现相同结果

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302224293.png)

#### 使用ThreadLocal为线程分配SimpleDateFormat副本

```java
static ThreadLocal < SimpleDateFormat > threadLocal = ThreadLocal.withInitial(() - > new SimpleDateFormat("yyyy-MM-dd HH:mm:ss:SS"));

public static void main(String[] args) throws InterruptedException {
    ExecutorService threadPool = Executors.newFixedThreadPool(100);
    for(int i = 0; i < 100; i++) {
        int finalI = i;
        //线程池中的线程
        threadPool.submit(() - > {
            new MyThreadLocalDemo3().caclData(finalI);
        });
    }
    threadPool.shutdown();
}

/**
 * 计算second后的日期
 * @param second
 * @return
 */
public String caclData(int second) {
    Date date = new Date(1000 * second);
    SimpleDateFormat simpleDateFormat = threadLocal.get();
    String dateStr = simpleDateFormat.format(date);
    logger.info("{}得到的时间字符串为:{}", Thread.currentThread().getId(), dateStr);
    return dateStr;
}
```

### web服务层共享变量

我们日常web开发都会涉及到各种service的调用，例如某个controller需要调用完service1之后再调用service2。 因为我们的controller和service都是单例的，所以如果我们希望多线程调用这些controller和service保证共享变量的隔离，也可以用到ThreadLocal。

为了实现这个示例，我们编写了线程获取共享变量的工具类。

```java
package threadlocal;

import java.text.SimpleDateFormat;

public class MyUserContextHolder {
    private static ThreadLocal<User> holder = new ThreadLocal<>();

    public static ThreadLocal<User> getHolder() {
        return holder;
    }
}
```

service调用链示例如下，笔者创建service1之后，所有线程复用这个service完成了调用。

```java
public class MyThreadLocalGetUserId {

    private static Logger logger = LoggerFactory.getLogger(MyThreadLocalGetUserId.class);

    private static ExecutorService threadPool = Executors.newFixedThreadPool(10);

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            int finalI = i;
            MyService1 service1 = new MyService1();
            threadPool.submit(() -> {

                service1.doWork1("username" + (finalI+1));
            });

        }


    }
}


class MyService1 {

    private static Logger logger = LoggerFactory.getLogger(MyThreadLocalGetUserId.class);

    public void doWork1(String name) {

        logger.info("service1 存储userName:" + name);
        ThreadLocal<String> holder = MyUserContextHolder.getHolder();
        holder.set(name);
        MyService2 service2 = new MyService2();
        service2.doWork2();
    }

}

class MyService2 {
    private static Logger logger = LoggerFactory.getLogger(MyThreadLocalGetUserId.class);

    public void doWork2() {
        ThreadLocal<String> holder = MyUserContextHolder.getHolder();

        logger.info("service2 获取userName:" + holder.get());
        MyService3 service3 = new MyService3();
        service3.doWork3();
    }
}


class MyService3 {
    private static Logger logger = LoggerFactory.getLogger(MyThreadLocalGetUserId.class);

    public void doWork3() {
        ThreadLocal<String> holder = MyUserContextHolder.getHolder();

        logger.info("service3获取 userName:" + holder.get());

// 避免oom问题
        holder.remove();
    }
}
```

从输出结果来看，在单例对象情况下，既保证了同一个线程间变量共享。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302223400.png)

也保证了不同线程之间变量的隔离。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302223498.png)

## 基于源码了解ThreadlLocal工作原理

### ThreadlLocal如何做到线程隔离的？

我们不妨以上面日期格式化工具为例子，从源码的角度分析问题，我们先回顾一下ThreadLocal的定义

```java
static ThreadLocal<SimpleDateFormat> threadLocal=ThreadLocal.withInitial(()->new SimpleDateFormat("yyyy-MM-dd HH:mm:ss:SS"));
```

然后是基于ThreadLocal实现的计算方法

```java
/**
 * 计算second后的日期
 * @param second
 * @return
 */
public String caclData(int second) {
    Date date = new Date(1000 * second);
    SimpleDateFormat simpleDateFormat = threadLocal.get();
    String dateStr = simpleDateFormat.format(date);
    logger.info("{}得到的时间字符串为:{}", Thread.currentThread().getId(), dateStr);
    return dateStr;
}
```

最后是调用代码

```java
public static void main(String[] args) throws InterruptedException {
    ExecutorService threadPool = Executors.newFixedThreadPool(100);
    for(int i = 0; i < 100; i++) {
        int finalI = i;
        //线程池中的线程
        threadPool.submit(() - > {
            new MyThreadLocalDemo3().caclData(finalI);
        });
    }
    threadPool.shutdown();
}
```

接下来我们就一步步从源码角度开始分析，首先我们的在线程池中的线程执行`new MyThreadLocalDemo3().caclData(finalI);`，此时代码走到了caclData方法，执行`threadLocal.get()`获取日期格式化对象。

我们查看这个get方法，可以看到ThreadLocal会从当前线程中取出一个map，然后从这个map中获取到SimpleDateFormat 。 当然如果这个map还没有创建就会通过setInitialValue完成map的创建，并调用initialValue将SimpleDateFormat 对象存到当前线程的map中。而这个initialValue我们已经在声明ThreadLocal变量时用withInitial做好了预埋。这也就意味着只要get发现map为空就会执行我们的initialValue方法完成共享变量初始化。

```java
public T get() {
    //获取当前线程
    Thread t = Thread.currentThread();
    //拿到当前线程中的map
    ThreadLocalMap map = getMap(t);
    //如果map不为空则取用当前这个ThreadLocal作为key取出值，否则通过setInitialValue完成ThreadLocal初始化
    if(map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if(e != null) {@
            SuppressWarnings("unchecked")
            T result = (T) e.value;
            return result;
        }
    }
    return setInitialValue();
}
private T setInitialValue() {
    //执行initialValue为当前线程创建变量value，在这里也就是我们要用的SimpleDateFormat 
    T value = initialValue();
    //获取当前线程map，有则直接以ThreadLocal为key将SimpleDateFormat 设置进去，若没有先创建再设置
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if(map != null) map.set(this, value);
    else createMap(t, value);
    //返回SimpleDateFormat 
    return value;
}
```

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302222926.png)

### ThreadLocalMap有什么特点？和HashMap有什么区别

从上文我们可知ThreadLocal是通过将共享变量存到线程的map中确保线程安全，那么这个map是什么样的？它和hashMap有什么区别？

我们通过源码查看到这个map为ThreadLocalMap，它是由一个个Entry 构成的数组

```java
 private Entry[] table;
```

并且每个Entry 的key是弱引用，这就意味着当触发GC时，Entry 的key也就是ThreadLocal就会被回收。

```java
static class Entry extends WeakReference < ThreadLocal <? >> {
    /** The value associated with this ThreadLocal. */
    Object value;
    Entry(ThreadLocal <? > k, Object v) {
        super(k);
        value = v;
    }
}
```

而这个map和hashma的不同点，我们也可以在resize方法中得知。当它发现要设置的值要存放的索引位置有值时，就会继续往后走，直到找到不为空的位置将值存到数组中，这也就是我们常说的线性探测法。

```java
 private void resize() {
     Entry[] oldTab = table;
     int oldLen = oldTab.length;
     int newLen = oldLen * 2;
     Entry[] newTab = new Entry[newLen];
     int count = 0;
     for(int j = 0; j < oldLen; ++j) {
         Entry e = oldTab[j];
         if(e != null) {
             ThreadLocal <? > k = e.get();
             if(k == null) {
                 e.value = null; // Help the GC
             } else {
                 //计算e要存放的索引位置
                 int h = k.threadLocalHashCode & (newLen - 1);
                 //线性探测赋值
                 while(newTab[h] != null) h = nextIndex(h, newLen);
                 newTab[h] = e;
                 count++;
             }
         }
     }
     setThreshold(newLen);
     size = count;
     table = newTab;
 }
```

## ThreadLocal使用注意事项

### 内存泄漏问题

我们有下面这样一段web代码，每次请求test0就会像线程池中的线程存一个4M的byte数组

```java
@RestController
public class TestController {
    final static ThreadPoolExecutor poolExecutor = new ThreadPoolExecutor(100, 100, 1, TimeUnit.MINUTES,
            new LinkedBlockingQueue<>());// 创建线程池，通过线程池，保证创建的线程存活

    final static ThreadLocal<Byte[]> localVariable = new ThreadLocal<Byte[]>();// 声明本地变量

    @RequestMapping(value = "/test0")
    public String test0(HttpServletRequest request) {
        poolExecutor.execute(() -> {
            Byte[] c = new Byte[4* 1024* 1024];
            localVariable.set(c);// 为线程添加变量

        });
        return "success";
    }

   
}
```

我们将这个代码打成jar包部署到服务器上并启动

```java
java -jar -Xms100m -Xmx100m # 调整堆内存大小
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof  # 表示发生OOM时输出日志文件，指定path为/tmp/heapdump.hprof
-XX:+PrintGCTimeStamps -XX:+PrintGCDetails -Xloggc:/tmp/heapTest.log # 打印日志、gc时间以及指定gc日志的路径
demo-0.0.1-SNAPSHOT.jar
```

只需频繁调用几次，就会输出OutOfMemoryError

```java
Exception in thread "pool-1-thread-5" java.lang.OutOfMemoryError: Java heap space
        at com.example.jstackTest.TestController.lambda$test0$0(TestController.java:25)
        at com.example.jstackTest.TestController$$Lambda$582/394910033.run(Unknown Source)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
        at java.lang.Thread.run(Thread.java:748)
```

问题的根本原因是我们没有及时回收Thread从ThreadLocal中得到的变量副本。因为我们的使用的线程是来自线程池中，所以线程使用结束后并不会被销毁，这就使得ThreadLocal中的变量副本会一直存储与线程池中的线程中，导致OOM。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302222717.png)

可能你会问了，不是说Java有GC回收机制嘛？为什么还会出现Thread中的ThreadLocalMap的value不会被回收呢？

我们上文提到ThreadLocal得到值，都会以ThreadLocal为key，ThreadLocal的initialValue方法得到的value作为值生成一个entry对象，存到当前线程的ThreadLocalMap中。 而我们的Entry的key是一个弱引用，这就使得一旦堆区空间不足就会触发CC时，这个key就会被回收，而我们这个key所对应的value仍然被线程池中的线程的强引用引用着，所以就迟迟无法回收，随着每个线程都出现这种情况导致OOM。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302222452.png)

所以我们每个线程使用完ThreadLocal之后，一定要使用remove方法清楚ThreadLocalMap中的value。

```java
localVariable.remove()
```

从源码中可以看到remove方法会遍历当前线程map然后将强引用之间的联系切断，确保下次GC可以回收掉可以无用对象。

```java
private void remove(ThreadLocal <? > key) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len - 1);
    for(Entry e = tab[i]; e != null; e = tab[i = nextIndex(i, len)]) {
        if(e.get() == key) {
            e.clear();
            expungeStaleEntry(i);
            return;
        }
    }
}
```

### 空指针问题

使用ThreadLocal存放包装类的时候也需要注意添加初始化方法，否则在拆箱时可能会出现空指针问题。

```java
 private static ThreadLocal < Long > threadLocal = new ThreadLocal < > ();
 public static void main(String[] args) {
     Long num = threadLocal.get();
     long sum = 1 + num;
 }
```

输出错误:

```java
Exception in thread "main" java.lang.NullPointerException
	at com.guide.base.MyThreadLocalNpe.main(MyThreadLocalNpe.java:11)
```

解决方式

```java
private  static ThreadLocal<Long> threadLocal = ThreadLocal.withInitial(()->new Long(0));
```

### 线程重用问题

这个问题和OOM问题类似，在线程池中服用同一个线程未及时清理，导致下一次HTTP请求时得到上一次ThreadLocal存储的结果。

```java
ThreadLocal < String > threadLocal = ThreadLocal.withInitial(() - > null); 
* 线程池中使用threadLocal示例
*
* @param accountCode
* @return
*/
@GetMapping("/account/getAccountByCode/{accountCode}")
@SentinelResource(value = "getAccountByCode")
ResultData < Map < String, Object >> getAccountByCode(@PathVariable(value = "accountCode") String accountCode) throws InterruptedException {
    Map < String, Object > result = new HashMap < > ();
    CountDownLatch countDownLatch = new CountDownLatch(1);
    threadPool.submit(() - > {
        String before = Thread.currentThread().getName() + ":" + threadLocal.get();
        log.info("before：" + before);
        result.put("before", before);
        log.info("调用getByCode，请求参数:{}", accountCode);
        QueryWrapper < Account > queryWrapper = new QueryWrapper < > ();
        queryWrapper.eq("account_code", accountCode);
        Account account = accountService.getOne(queryWrapper);
        String after = Thread.currentThread().getName() + ":" + account.getAccountName();
        result.put("after", account.getAccountName());
        log.info("after：" + after);
        threadLocal.set(account.getAccountName());
        //完成计算后，使用countDown按下倒计时门闩，通知主线程可以执行后续步骤
        countDownLatch.countDown();
    });
    //等待上述线程池完成
    countDownLatch.await();
    return ResultData.success(result);
}
```

从输出结果可以看出，我们第二次进行HTTP请求时，threadLocal第一get获得了上一次请求的值，出现脏数据。

```java
C:\Users\xxx>curl http://localhost:9000/account/getAccountByCode/demoData
{"status":100,"message":"操作成功","data":{"before":"pool-2-thread-1:null","after":"pool-2-thread-1:demoData"},"success":true,"timestamp":1678410699943}
C:\Users\xxx>curl http://localhost:9000/account/getAccountByCode/Zsy
{"status":100,"message":"操作成功","data":{"before":"pool-2-thread-1:demoData","after":"pool-2-thread-1:zsy"},"success":true,"timestamp":1678410707473}
```

解决方法也很简单，手动添加一个threadLocal的remove方法即可

```java
@GetMapping("/account/getAccountByCode/{accountCode}")
@SentinelResource(value = "getAccountByCode")
ResultData < Map < String, Object >> getAccountByCode(@PathVariable(value = "accountCode") String accountCode) throws InterruptedException {
    Map < String, Object > result = new HashMap < > ();
    CountDownLatch countDownLatch = new CountDownLatch(1);
    try {
        threadPool.submit(() - > {
            String before = Thread.currentThread().getName() + ":" + threadLocal.get();
            log.info("before：" + before);
            result.put("before", before);
            log.info("调用getByCode，请求参数:{}", accountCode);
            QueryWrapper < Account > queryWrapper = new QueryWrapper < > ();
            queryWrapper.eq("account_code", accountCode);
            Account account = accountService.getOne(queryWrapper);
            String after = Thread.currentThread().getName() + ":" + account.getAccountName();
            result.put("after", after);
            log.info("after：" + after);
            threadLocal.set(account.getAccountName());
            //完成计算后，使用countDown按下倒计时门闩，通知主线程可以执行后续步骤
            countDownLatch.countDown();
        });
    } finally {
        threadLocal.remove();
    }
    //等待上述线程池完成
    countDownLatch.await();
    return ResultData.success(result);
}
```

## ThreadLocal的不可继承性

### 通过代码证明ThreadLocal的不可继承性

如下代码所示，`ThreadLocal`子线程无法拿到主线程维护的内部变量

```java
/**
 * ThreadLocal 不具备可继承性
 */
public class ThreadLocalInheritTest {
    private static ThreadLocal<String> THREAD_LOCAL = new ThreadLocal<>();

    private static Logger logger = LoggerFactory.getLogger(ThreadLocalInheritTest.class);

    public static void main(String[] args) {
        THREAD_LOCAL.set("mainVal");
        logger.info("主线程的值为: " + THREAD_LOCAL.get());

        new Thread(() -> {
            try {
                //睡眠3s确保上述逻辑运行
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            logger.info("子线程获取THREAD_LOCAL的值为:[{}]", THREAD_LOCAL.get());
        }).start();
    }

}
```

### 使用InheritableThreadLocal实现主线程内部变量继承

如下所示，我们将`THREAD_LOCAL` 改为`InheritableThreadLocal`类即可解决问题。

```java
/**
 * ThreadLocal 不具备可继承性
 */
public class ThreadLocalInheritTest {

    private static ThreadLocal<String> THREAD_LOCAL = new InheritableThreadLocal<>();

    private static Logger logger = LoggerFactory.getLogger(ThreadLocalInheritTest.class);

    public static void main(String[] args) {
        THREAD_LOCAL.set("mainVal");
        logger.info("主线程的值为: " + THREAD_LOCAL.get());

        new Thread(() -> {
            try {
                //睡眠3s确保上述逻辑运行
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            logger.info("子线程获取THREAD_LOCAL的值为:[{}]", THREAD_LOCAL.get());
        }).start();
    }

}
```

### 基于源码剖析原因

因为 ThreadLocal会将变量存储在线程的 ThreadLocalMap中，所以我们先看看InheritableThreadLocal的getMap方法，从而定位到了inheritableThreadLocals

```java
 ThreadLocalMap getMap(Thread t) {
	return t.inheritableThreadLocals;
 }
```

然后我们到Thread类去定位这个变量的使用之处，所以我们在创建线程的地方打了个断点

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302219905.png)

从而定位到这段init代码，它会获取主线程的ThreadLocalMap并将主线程ThreadLocalMap中的值存到子线程的ThreadLocalMap中。

```java
private void init(ThreadGroup g, Runnable target, String name, long stackSize, AccessControlContext acc, boolean inheritThreadLocals) {
    if(name == null) {
        throw new NullPointerException("name cannot be null");
    }
    this.name = name;
    //获取当前线程的主线程
    Thread parent = currentThread();
    if(inheritThreadLocals && parent.inheritableThreadLocals != null) this.inheritableThreadLocals =
        //将主线程的map的值存到子线程中
        ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
    /* Stash the specified stack size in case the VM cares */
    this.stackSize = stackSize;
    /* Set thread ID */
    tid = nextThreadID();
}
```

createInheritedMap内部就会调用ThreadLocalMap方法将主线程的ThreadLocalMap的值存到子线程的ThreadLocalMap中。

```java
private ThreadLocalMap(ThreadLocalMap parentMap) {
    Entry[] parentTable = parentMap.table;
    int len = parentTable.length;
    setThreshold(len);
    table = new Entry[len];
    for(int j = 0; j < len; j++) {
        Entry e = parentTable[j];
        if(e != null) {
            @SuppressWarnings("unchecked")
            ThreadLocal < Object > key = (ThreadLocal < Object > ) e.get();
            if(key != null) {
                Object value = key.childValue(e.value);
                Entry c = new Entry(key, value);
                int h = key.threadLocalHashCode & (len - 1);
                while(table[h] != null) h = nextIndex(h, len);
                table[h] = c;
                size++;
            }
        }
    }
}
```

## ThreadLocal在Spring中的运用

### DateTimeContextHolder

```java
private static final ThreadLocal < DateTimeContext > dateTimeContextHolder = new NamedThreadLocal < > ("DateTimeContext");
```

#### 使用示例

该工具类和`simpledateformate`差不多，使用示例如下所示，是spring封装的，使用起来也很方便

```java
public class DateTimeContextHolderTest {


    protected static final Logger logger = LoggerFactory.getLogger(DateTimeContextHolderTest.class);

    private final static DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private Set<String> set = new ConcurrentHashSet<String>();

    @Test
    public void test_withLocale_same() throws Exception {
        ExecutorService threadPool = Executors.newFixedThreadPool(30);

        for (int i = 0; i < 30; i++) {
            int finalI = i;
            threadPool.execute(() -> {
                LocalDate currentdate = LocalDate.now();
                int year = currentdate.getYear();
                int month = currentdate.getMonthValue();
                int day = 1 + finalI;
                LocalDate date = LocalDate.of(year, month, day);

                DateTimeFormatter fmt = DateTimeContextHolder.getFormatter(formatter, null);
                String text = date.format(fmt);
                set.add(text);
                logger.info("转换后的时间为" + text);
            });
        }

        threadPool.shutdown();
        while (!threadPool.isTerminated()) {

        }

        logger.info("查看去重后的数量"+set.size());


    }
}
```

## 小结

1. ThreadLocal通过在将共享变量拷贝一份到每个线程内部的ThreadLocalMap保证线程安全。
2. ThreadLocal使用完成后记得使用remove方法手动清理线程中的ThreadLocalMap过期对象，避免OOM和一些业务上的错误。
3. ThreadLocal是不可被继承了，如果想使用主线的的ThreadLocal，就必须使用InheritableThreadLocal。

## 参考文献

[Java 并发 - ThreadLocal详解(opens new window)](https://www.pdai.tech/md/java/thread/java-thread-x-threadlocal.html#java-开发手册中推荐的-threadlocal)

[面试：为了进阿里，死磕了ThreadLocal内存泄露原因(opens new window)](https://www.cnblogs.com/Ccwwlx/p/13581004.html)

[ThreadLocal出现OOM内存溢出的场景和原理分析](https://www.cnblogs.com/jobbible/p/13364292.html#:~:text=取消注释：threadLocal.remove ();,结果不会出现OOM，可以看出堆内存的变化呈现锯齿状，证明每一次remove ()之后，ThreadLocal的内存释放掉了！)