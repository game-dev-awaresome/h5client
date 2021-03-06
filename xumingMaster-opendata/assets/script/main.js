// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

var Const = {
    OpenDataKey_Score: "score",
};

cc.Class({
    extends: cc.Component,

    properties: {
        //分享组件
        shareNode: {
            type: cc.Node,
            default: null
        },

        tipsLb:{
            type: cc.Label,
            default: null
        },

        //排名组件
        rankNode: {
            type: cc.Node,
            default: null
        },

        rankPanel:{
            type: cc.Node,
            default: null
        },

        myRankItem: {
            type: cc.Node,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.m_datas = [];
        this.m_pageSize = 7;

        this.m_openId = "";
        this.m_myScore = 0;
        this.m_myDataIndex = 0;

        var _this = this;
        wx.onMessage(function(data){
            // console.log("onMessage");
            // console.log(data);
            switch(data.eventType){
                case 1:
                    //打开排行榜
                    _this.onRankPanelOpen();
                    break;

                case 2:
                    //打开分享
                    _this.onSharePanelOpen();
                    break;

                case 3:
                    //初始化基础信息
                    if(data.openId != null){
                        _this.m_openId = data.openId;
                        wx.getFriendCloudStorage({
                            keyList: [Const.OpenDataKey_Score],
                            success: (res)=>{
                                console.log("GetFriendRank success");
                                _this.updateDatas(res);
                
                                for(var i = 0; i < _this.m_datas.length; i++){
                                    var data = _this.m_datas[i];
                                    var isMe = _this.m_openId == data.openId;
                                    
                                    if(!isMe){
                                        continue;
                                    }
                                    _this.m_myDataIndex = i;
                                }
                            }
                        });
                    }
                    break;

                case 10:
                    //打开好友排行榜
                    _this.getFriendRank();
                    break;

                case 11:
                    //刷新世界排行榜
                    _this.getGlobalRank(data);
                    break;
            }
        });
    },

    start () {
    },

    update (dt) {
    },

    getFriendRank(){
        this.m_datas = [];

        var _this = this;
        wx.getFriendCloudStorage({
            keyList: [Const.OpenDataKey_Score],
            success: (res)=>{
                console.log("GetFriendRank success");
                _this.updateDatas(res);
                _this.updateDataItems();
            },

            fail: ()=>{
                console.log("GetFriendRank fail");
            },

            complete: ()=>{
                console.log("GetFriendRank complete");

            }
        });
    },

    getGlobalRank(data){
        var datas = data.datas;
        for(var i = 0; i < datas.length; i++){
            datas[i].index = i;
        }
        this.m_datas = datas;
        this.updateDataItems();
    },

    sortRank(v1, v2){
        var score1 = Number(v1.score);
        var score2 = Number(v2.score);

        return score1 < score2;
    },

    updateDatas(res){
        var dataLen = res.data.length;
                
        this.m_curPage = 0;
        this.m_maxPage = Math.floor(dataLen / this.m_pageSize);
        this.m_datas = [];
        for(var i = 0; i < dataLen; i++){
            var data = res.data[i];
            var kvDataList = data.KVDataList;
            var score = "0";

            for(var j = 0; j < kvDataList.length; j++){
                if(kvDataList[j].key == Const.OpenDataKey_Score){
                    score = kvDataList[j].value;
                    break;
                }
            }

            var obj = {
                nickName: decodeURIComponent(data.nickname),
                avatarUrl: data.avatarUrl,
                openId: data.openid,
                score: score
            };
            this.m_datas.push(obj);
        }
        
        this.m_datas.sort(this.sortRank);

        for(var i = 0; i < this.m_datas.length; i++){
            let data = this.m_datas[i];
            data.index = i;
        }
    },

    updateDataItems(){
        var rankItems = this.rankPanel.children;

        for(var i = 0; i < this.m_pageSize; i++){
            var rankItem = rankItems[i];
            var dataIndex = this.m_curPage * this.m_pageSize + i;

            if(dataIndex < this.m_datas.length){
                var data = this.m_datas[dataIndex];

                this.updateItem(rankItem, data);

                rankItem.active = true;
            }else{
                rankItem.active = false;
            }
        }
        this.updateMyDataItem();
    },

    updateMyDataItem(){
        this.myRankItem.active = false;

        for(var i = 0; i < this.m_datas.length; i++){
            var data = this.m_datas[i];
            var isMe = this.m_openId == data.openId;
            console.log(this.m_openId);
            console.log(data.openId);
            
            if(!isMe){
                continue;
            }

            this.updateItem(this.myRankItem, data);
            this.myRankItem.active = true;
        }
    },

    updateItem(item, obj){
        item.getChildByName("lb_name").getComponent(cc.Label).string = obj.nickName;
        this.setImageFromUrl(item.getChildByName("img_avatar").getComponent(cc.Sprite), obj.avatarUrl);

        if(item.getChildByName("lb_rank")){
            item.getChildByName("lb_rank").getComponent(cc.Label).string = obj.index + 1 + '';
        }

        if(item.getChildByName("lb_score")){
            item.getChildByName("lb_score").getComponent(cc.Label).string = obj.score;
        }
    },

    setImageFromUrl(sprite, url){
        if(url == ""){
            sprite.spriteFrame = null;
            return;
        }
        url += "?aaa=aa.jpg";
        // console.log("load image" + url);
        cc.loader.load(url, function (err, tex) {
            // console.log(err);
            sprite.spriteFrame = new cc.SpriteFrame(tex);
        });
    },

    onRankPanelOpen(){
        this.rankNode.active = true;
        this.shareNode.active = false;
        this.getFriendRank();
    },
    
    onSharePanelOpen(){
        this.rankNode.active = false;
        this.shareNode.active = true;

        var _this = this;
        wx.getFriendCloudStorage({
            keyList: [Const.OpenDataKey_Score],
            success: (res)=>{
                console.log("GetFriendRank success");
                _this.updateDatas(res);

                for(var i = 0; i < _this.m_datas.length; i++){
                    var data = _this.m_datas[i];
                    var isMe = _this.m_openId == data.openId;
                    
                    if(!isMe){
                        continue;
                    }
                    
                    if(i < _this.m_myDataIndex){
                        //提示超过好友
                        let otherData = _this.m_datas[i+1];
                        _this.updateItem(_this.shareNode, otherData);
                        _this.tipsLb.string = "恭喜你超过好友";
                    }else{
                        //提示赶超好友
                        if(i - 1 >= 0){
                            let otherData = _this.m_datas[i - 1];
                            _this.updateItem(_this.shareNode, otherData);
                            _this.tipsLb.string = "继续加油赶超好友";
                        }else{
                            let obj = {
                                nickName: "",
                                avatarUrl: ""
                            };
                            
                            _this.updateItem(_this.shareNode, obj);
                            _this.tipsLb.string = "恭喜，在好友中排名第一";
                        }
                    }
                    _this.m_myDataIndex = i;
                }
            },

            fail: ()=>{
                console.log("GetFriendRank fail");
            },

            complete: ()=>{
                console.log("GetFriendRank complete");

            }
        });
    }
});
