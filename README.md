# AWS CDK VPC サンプルプロジェクト

このリポジトリは、AWS CDKを使用してシンプルなVPCの設定を行う方法を示すサンプルプロジェクトです。マルチAZ対応のVPC、パブリックサブネット、インターネットゲートウェイなどのWeb公開用ネットワークリソースの作成例を含んでいます。

## 概要

このプロジェクトでは、以下のリソースと設定を AWS CDK を使って定義しています：

- VPCの作成 (CIDR: 10.0.0.0/16)
- 2つのアベイラビリティゾーンにまたがるサブネット構成
  - パブリックサブネットのみ（インターネットゲートウェイへのルートあり）
- インターネットゲートウェイ
- 各サブネット用のルートテーブル設定
- S3およびDynamoDBへのVPCエンドポイント
- 必要な出力値の定義（VPC ID、サブネットIDsなど）

## 前提条件

このプロジェクトを使用するためには、以下が必要です：

- AWS アカウント
- Node.js (バージョン 14.x 以上)
- AWS CDK CLI (バージョン 2.x)
- AWS CLI（設定済み）

## インストール方法

```bash
# リポジトリをクローン
git clone <リポジトリURL>
cd aws-cdk-vpc

# 依存関係をインストール
npm install
```

## 使用方法

### 1. プロジェクトのコンパイル

```bash
npm run build
```

### 2. スタックの合成

```bash
npx cdk synth
```

### 3. デプロイ

```bash
npx cdk deploy
```

> **注意**: 実際にデプロイすると、AWS アカウントに課金が発生する可能性があります。

## 実装例の解説

### VPCの作成

```typescript
this.vpc = new ec2.Vpc(this, 'MainVpc', {
  maxAzs: 2,  // 2つのアベイラビリティゾーンを使用
  cidr: '10.0.0.0/16',  // VPCのCIDRブロック
  subnetConfiguration: [
    {
      name: 'public',
      subnetType: ec2.SubnetType.PUBLIC,  // パブリックサブネット
      cidrMask: 24,
    }
  ],
  natGateways: 0,  // NATゲートウェイなし
  enableDnsHostnames: true,
  enableDnsSupport: true,
});
```

### VPCのDNSサポート設定

```typescript
// VPCのDNSサポートを有効化
this.vpc.enableDnsHostnames = true;
this.vpc.enableDnsSupport = true;
```

### VPCエンドポイントの追加

```typescript
// S3へのVPCエンドポイントを追加
this.vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});

// DynamoDBへのVPCエンドポイントを追加
this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
  service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
});
```

### 出力値の定義

```typescript
// VPC ID
new CfnOutput(this, 'VpcId', {
  value: this.vpc.vpcId,
  description: 'VPC ID',
  exportName: 'MainVpcId',
});

// パブリックサブネットIDs
const publicSubnetIds = this.vpc.publicSubnets.map(subnet => subnet.subnetId);
new CfnOutput(this, 'PublicSubnetIds', {
  value: publicSubnetIds.join(','),
  description: 'パブリックサブネットIDs',
  exportName: 'MainVpcPublicSubnetIds',
});
```

## カスタマイズ方法

実際の環境で使用する場合は、以下の点を変更してください：

1. `lib/cdk-vpc-stack.ts` の `cidr` パラメータを適切なCIDRブロックに変更
2. `maxAzs` パラメータをプロジェクトに必要なアベイラビリティゾーン数に調整
3. 必要に応じて `natGateways` パラメータを変更（高可用性が必要な場合は `maxAzs` と同じ値に設定）
4. 必要なサブネットタイプのみを設定（アイソレートサブネットが必要な場合は追加）

## Webサーバー用途について

このVPC構成は、Webサーバーを公開するのに最適な以下の特徴を持っています：

- すべてのサブネットがパブリックアクセス可能で、EC2インスタンスをデプロイするとすぐにインターネットに公開できる
- インターネットゲートウェイによる双方向通信（インバウンド/アウトバウンド）が可能
- 複数のアベイラビリティゾーンを活用した高可用性設計

## コスト最適化

このサンプルでは、コスト最適化のために以下の設定を行っています：

- NATゲートウェイを使用せず、インターネットゲートウェイのみを使用
- S3およびDynamoDBへのVPCエンドポイントを使用（データ転送コストの削減）

## クリーンアップ

デプロイしたリソースを削除するには：

```bash
npx cdk destroy
```

> **注意**: VPCを削除する前に、そのVPC内に作成した他のリソース（EC2インスタンス、RDSインスタンスなど）が削除されていることを確認してください。

## 参考リソース

- [AWS CDK ドキュメント](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS VPC ドキュメント](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [AWS CDK API リファレンス - EC2/VPC](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ec2-readme.html)

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
